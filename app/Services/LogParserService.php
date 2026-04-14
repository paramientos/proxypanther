<?php

namespace App\Services;

use App\Models\ProxySite;
use App\Models\SecurityEvent;
use App\Models\BannedIp;
use App\Events\SecurityEventOccurred;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Http;

class LogParserService
{
    public function parseAll(): void
    {
        $sites = ProxySite::all();

        foreach ($sites as $site) {
            $this->parseForSite($site);
        }
    }

    public function parseForSite(ProxySite $site): void
    {
        $logPath = storage_path("logs/caddy-{$site->id}.log");

        if (!File::exists($logPath)) {
            return;
        }

        $lines = file($logPath);
        $totalRequests = 0;
        $blockedRequests = 0;
        $hits2xx = 0;
        $hits4xx = 0;
        $hits5xx = 0;
        $totalLatency = 0;
        $latencyCount = 0;
        $ipAttackCounts = [];

        foreach ($lines as $line) {
            $data = json_decode($line, true);
            if (!$data) continue;

            $totalRequests++;

            // Track Latency (duration is in seconds in Caddy logs)
            if (isset($data['duration'])) {
                $totalLatency += ($data['duration'] * 1000); // convert to ms
                $latencyCount++;
            }

            $status = $data['status'] ?? 200;
            
            // Track Status Codes
            if ($status >= 200 && $status < 300) $hits2xx++;
            elseif ($status >= 400 && $status < 500) $hits4xx++;
            elseif ($status >= 500) $hits5xx++;

            if ($status === 403) {
                $blockedRequests++;
                $ip = $data['request']['remote_ip'] ?? 'unknown';
                // Resolve GeoIP
                $geo = $this->resolveGeoIP($ip);

                // Log as Security Event
                $event = SecurityEvent::create([
                    'proxy_site_id' => $site->id,
                    'type'          => $attackType,
                    'ip_address'    => $ip,
                    'country_code'  => $geo['country_code'] ?? null,
                    'country_name'  => $geo['country'] ?? null,
                    'city'          => $geo['city'] ?? null,
                    'request_method'=> $data['request']['method'] ?? 'GET',
                    'request_path'  => $data['request']['uri'] ?? '/',
                    'user_agent'    => $data['request']['headers']['User-Agent'][0] ?? null,
                    'payload'       => json_encode($data['request']['headers'] ?? []),
                ]);

                // Send notification if configured
                $this->notify($site, $event);

                // Broadcast event for real-time UI
                SecurityEventOccurred::dispatch($event);

                // Auto-Mitigation Logic: Track attacks per IP in this batch
                if ($ip !== 'unknown' && $ip !== '127.0.0.1') {
                    $ipAttackCounts[$ip] = ($ipAttackCounts[$ip] ?? 0) + 1;
                }
            }
        }

        // Update site stats
        $site->increment('total_requests', $totalRequests);
        $site->increment('blocked_requests', $blockedRequests);
        $site->increment('hits_2xx', $hits2xx);
        $site->increment('hits_4xx', $hits4xx);
        $site->increment('hits_5xx', $hits5xx);

        if ($latencyCount > 0) {
            $currentAvg = $site->avg_latency_ms;
            $newAvg = $totalLatency / $latencyCount;
            // Simple moving average
            $site->update(['avg_latency_ms' => ($currentAvg + $newAvg) / 2]);
        }

        // Auto-Ban IPs that exceeded threshold (e.g., 3 attacks in one batch)
        foreach ($ipAttackCounts as $ip => $count) {
            if ($count >= 3) {
                BannedIp::firstOrCreate(
                    ['ip_address' => $ip],
                    ['reason' => "Auto-banned after {$count} blocked security events in a single batch."]
                );
                // Trigger Caddy sync to apply the new ban
                app(CaddyService::class)->sync();
            }
        }

        // Clear the log file
        File::put($logPath, '');
    }

    protected function notify(ProxySite $site, SecurityEvent $event): void
    {
        if (!$site->notification_webhook_url) return;

        try {
            Http::post($site->notification_webhook_url, [
                'text' => "🚨 *ProxyPanther Alert*\n*Site:* {$site->domain}\n*Event:* {$event->type}\n*IP:* {$event->ip_address}\n*Path:* {$event->request_path}\n*Status:* Blocked"
            ]);
        } catch (\Exception $e) {
            // Silently fail notification
        }
    }

    protected function detectAttackType(array $data): string
    {
        $uri = $data['request']['uri'] ?? '';
        $ua = $data['request']['headers']['User-Agent'][0] ?? '';

        if (str_contains($uri, 'union') || str_contains($uri, 'select') || str_contains($uri, 'information_schema') || str_contains($uri, 'sleep(')) return 'SQLi';
        if (str_contains($uri, '<script') || str_contains($uri, 'onerror=') || str_contains($uri, 'onload=')) return 'XSS';
        if (str_contains($uri, '../') || str_contains($uri, '/etc/passwd')) return 'LFI';
        if (preg_match('/(sqlmap|nikto|nmap|zgrab|masscan|burp|metasploit|gobuster|dirbuster)/i', $ua)) return 'Bot';
        if (str_contains($uri, '.env') || str_contains($uri, '.git')) return 'SensitivePath';

        return 'WAF_Block';
    }

    protected function resolveGeoIP(string $ip): array
    {
        if ($ip === 'unknown' || $ip === '127.0.0.1') return [];

        return \Illuminate\Support\Facades\Cache::remember("geoip_{$ip}", 86400, function() use ($ip) {
            try {
                $response = Http::timeout(3)->get("http://ip-api.com/json/{$ip}");
                if ($response->successful()) {
                    $data = $response->json();
                    return [
                        'country_code' => $data['countryCode'] ?? null,
                        'country'      => $data['country'] ?? null,
                        'city'         => $data['city'] ?? null,
                    ];
                }
            } catch (\Exception $e) {
                // Silently skip on error
            }
            return [];
        });
    }
}
