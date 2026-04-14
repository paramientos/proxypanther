<?php

namespace App\Services;

use App\Events\BackendHealthUpdated;
use App\Models\ProxySite;
use App\Models\UptimeEvent;
use App\Models\HealthCheckLog;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class HealthCheckService
{
    public function checkAll()
    {
        $sites = ProxySite::where('is_active', true)->get();
        foreach ($sites as $site) {
            $this->checkSite($site);
        }
    }

    public function checkSite(ProxySite $site)
    {
        $urls = preg_split('/[,\s]+/', $site->backend_url, -1, PREG_SPLIT_NO_EMPTY);
        $isOnline = false;
        $lastError = null;

        foreach ($urls as $url) {
            $start = microtime(true);
            if ($site->backend_type === 'php_fpm') {
                $status = $this->checkPhpFpm($url);
            } else {
                $status = $this->checkHttp($url);
            }
            $latency = (microtime(true) - $start) * 1000;

            if ($status['online']) {
                $isOnline = true;
                $this->logHealth($site, 'UP', $status['code'] ?? null, $latency);
                break;
            } else {
                $lastError = $status['error'];
                $this->logHealth($site, 'DOWN', $status['code'] ?? null, $latency, $lastError);
            }
        }

        $oldStatus = $site->is_online;
        $site->update([
            'is_online' => $isOnline,
            'last_check_at' => now(),
            'last_error' => $isOnline ? null : $lastError,
        ]);

        // Uptime tracking
        if ($oldStatus !== $isOnline) {
            if (!$isOnline) {
                // Site went down
                UptimeEvent::create([
                    'proxy_site_id' => $site->id,
                    'type' => 'down',
                    'reason' => $lastError,
                ]);
            } else {
                // Site came back up - find last down event and calculate duration
                $lastDown = UptimeEvent::where('proxy_site_id', $site->id)
                    ->where('type', 'down')
                    ->whereNull('duration_seconds')
                    ->latest()
                    ->first();

                if ($lastDown) {
                    $duration = (int) $lastDown->created_at->diffInSeconds(now());
                    $lastDown->update(['duration_seconds' => $duration]);
                    $site->increment('total_downtime_seconds', $duration);
                }

                UptimeEvent::create([
                    'proxy_site_id' => $site->id,
                    'type' => 'up',
                ]);
            }

            // Recalculate uptime percentage
            $this->recalculateUptime($site);

            event(new BackendHealthUpdated($site));
        }

        // Set monitoring start if not set
        if (!$site->monitoring_started_at) {
            $site->update(['monitoring_started_at' => now()]);
        }
    }

    private function recalculateUptime(ProxySite $site): void
    {
        $startedAt = $site->monitoring_started_at ?? $site->created_at;
        $totalSeconds = max(1, (int) $startedAt->diffInSeconds(now()));
        $downSeconds = $site->total_downtime_seconds;

        // Also add current ongoing downtime if site is down
        if (!$site->is_online) {
            $lastDown = UptimeEvent::where('proxy_site_id', $site->id)
                ->where('type', 'down')
                ->whereNull('duration_seconds')
                ->latest()
                ->first();
            if ($lastDown) {
                $downSeconds += (int) $lastDown->created_at->diffInSeconds(now());
            }
        }

        $uptimePct = max(0, min(10000, (int) (($totalSeconds - $downSeconds) / $totalSeconds * 10000)));
        $site->update(['uptime_percentage' => $uptimePct]);
    }

    private function checkHttp($url)
    {
        // Ensure URL has protocol
        if (!preg_match('~^(?:f|ht)tps?://~i', $url)) {
            $url = "http://" . $url;
        }

        try {
            // Use a shorter timeout and allow for various failure modes
            $response = Http::timeout(3)
                ->connectTimeout(2)
                ->get($url);
            
            return [
                'online' => $response->successful() || $response->status() === 503 || $response->status() === 401 || $response->status() === 403,
                'code' => $response->status(),
                'error' => $response->successful() ? null : "HTTP Response: " . $response->status(),
            ];
        } catch (\Exception $e) {
            Log::warning("Health check failed for $url: " . $e->getMessage());
            return [
                'online' => false,
                'code' => null,
                'error' => $e->getMessage(),
            ];
        }
    }

    private function logHealth(ProxySite $site, string $status, ?int $code, float $latency, ?string $error = null)
    {
        HealthCheckLog::create([
            'proxy_site_id' => $site->id,
            'status' => $status,
            'response_code' => $code,
            'latency' => $latency,
            'error_message' => $error,
            'created_at' => now(),
        ]);

        // Keep only last 200 logs per site to save space
        if (rand(1, 20) === 1) {
            HealthCheckLog::where('proxy_site_id', $site->id)
                ->where('created_at', '<', now()->subDays(3))
                ->delete();
        }
    }

    private function checkPhpFpm($url)
    {
        // Remove unix: prefix if present
        $path = str_replace('unix:', '', $url);

        if (file_exists($path)) {
            // Check if it's a socket
            try {
                $socket = @fsockopen("unix://$path", -1, $errno, $errstr, 5);
                if ($socket) {
                    fclose($socket);
                    return ['online' => true, 'error' => null];
                }
                return ['online' => false, 'error' => "Socket error: $errstr ($errno)"];
            } catch (\Exception $e) {
                return ['online' => false, 'error' => $e->getMessage()];
            }
        }

        // Check if it's a TCP address (e.g. 127.0.0.1:9000)
        if (str_contains($url, ':')) {
            [$host, $port] = explode(':', $url);
            try {
                $socket = @fsockopen($host, $port, $errno, $errstr, 5);
                if ($socket) {
                    fclose($socket);
                    return ['online' => true, 'error' => null];
                }
                return ['online' => false, 'error' => "TCP error: $errstr ($errno)"];
            } catch (\Exception $e) {
                return ['online' => false, 'error' => $e->getMessage()];
            }
        }

        return ['online' => false, 'error' => "Invalid PHP-FPM address: $url"];
    }
}
