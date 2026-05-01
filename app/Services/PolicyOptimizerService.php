<?php

namespace App\Services;

use App\Models\BannedIp;
use App\Models\ProxySite;
use App\Models\SecurityEvent;
use Illuminate\Support\Collection;

class PolicyOptimizerService
{
    private const THREAT_WINDOW_DAYS = 7;

    private const IP_BAN_THRESHOLD = 10;

    private const COUNTRY_THRESHOLD = 20;

    private const RATE_LIMIT_THRESHOLD = 50;

    public function analyze(): array
    {
        $since = now()->subDays(self::THREAT_WINDOW_DAYS);

        $events = SecurityEvent::with('proxySite')
            ->where('created_at', '>=', $since)
            ->get();

        $recommendations = [];

        $recommendations = array_merge(
            $recommendations,
            $this->analyzeIpThreats($events),
            $this->analyzeCountryThreats($events),
            $this->analyzeAttackTypes($events),
            $this->analyzeSiteRateLimits($events),
            $this->analyzeWafGaps($events),
        );

        usort($recommendations, fn ($a, $b) => $b['severity_score'] <=> $a['severity_score']);

        return [
            'recommendations' => $recommendations,
            'stats' => $this->buildStats($events),
            'analyzed_at' => now()->toISOString(),
        ];
    }

    public function apply(array $actions): array
    {
        $applied = [];

        foreach ($actions as $action) {
            $result = match ($action['type']) {
                'ban_ip' => $this->applyBanIp($action),
                'block_country' => $this->applyBlockCountry($action),
                'enable_waf' => $this->applyEnableWaf($action),
                'increase_rate_limit' => $this->applyRateLimit($action),
                'enable_bot_fight' => $this->applyBotFight($action),
                'enable_under_attack' => $this->applyUnderAttack($action),
                'add_waf_rule' => $this->applyWafRule($action),
                default => null,
            };

            if ($result) {
                $applied[] = $result;
            }
        }

        return $applied;
    }

    private function analyzeIpThreats(Collection $events): array
    {
        $recommendations = [];

        $byIp = $events->groupBy('ip_address')
            ->map(fn ($g) => $g->count())
            ->filter(fn ($count) => $count >= self::IP_BAN_THRESHOLD)
            ->sort(fn ($a, $b) => $b <=> $a);

        $bannedIps = BannedIp::pluck('ip_address')->toArray();

        foreach ($byIp->take(10) as $ip => $count) {
            if (in_array($ip, $bannedIps) || ! $ip) {
                continue;
            }

            $recommendations[] = [
                'id' => 'ban_ip_'.md5($ip),
                'type' => 'ban_ip',
                'severity' => $count >= 50 ? 'critical' : 'high',
                'severity_score' => min(100, $count * 2),
                'title' => "Ban malicious IP: {$ip}",
                'description' => "This IP triggered {$count} security events in the last ".self::THREAT_WINDOW_DAYS.' days.',
                'impact' => 'Immediately blocks all traffic from this IP across all sites.',
                'payload' => ['ip' => $ip, 'reason' => "Auto-banned: {$count} security events in ".self::THREAT_WINDOW_DAYS.' days'],
            ];
        }

        return $recommendations;
    }

    private function analyzeCountryThreats(Collection $events): array
    {
        $recommendations = [];

        $byCountry = $events->groupBy('country_code')
            ->map(fn ($g) => ['count' => $g->count(), 'name' => $g->first()->country_name])
            ->filter(fn ($d) => $d['count'] >= self::COUNTRY_THRESHOLD)
            ->sortByDesc('count');

        $sites = ProxySite::where('is_active', true)->get();

        foreach ($byCountry->take(5) as $code => $data) {
            if (! $code) {
                continue;
            }

            foreach ($sites as $site) {
                $denylist = $site->geoip_denylist ?? [];
                if (in_array($code, $denylist)) {
                    continue;
                }

                $recommendations[] = [
                    'id' => "block_country_{$code}_{$site->id}",
                    'type' => 'block_country',
                    'severity' => 'high',
                    'severity_score' => min(90, $data['count']),
                    'title' => "Block {$data['name']} ({$code}) on {$site->name}",
                    'description' => "{$data['count']} attacks originated from {$data['name']} in the last ".self::THREAT_WINDOW_DAYS.' days.',
                    'impact' => "Adds {$code} to the GeoIP denylist for {$site->name}.",
                    'payload' => ['site_id' => $site->id, 'country_code' => $code],
                ];
            }
        }

        return $recommendations;
    }

    private function analyzeAttackTypes(Collection $events): array
    {
        $recommendations = [];

        $byType = $events->groupBy('type')->map(fn ($g) => $g->count());

        $sqlCount = ($byType['sql_injection'] ?? 0) + ($byType['sqli'] ?? 0);
        $xssCount = ($byType['xss'] ?? 0) + ($byType['cross_site_scripting'] ?? 0);
        $botCount = ($byType['bad_bot'] ?? 0) + ($byType['bot'] ?? 0) + ($byType['scanner'] ?? 0);

        $sites = ProxySite::where('is_active', true)->get();

        foreach ($sites as $site) {
            if (($sqlCount + $xssCount) >= 5 && ! $site->waf_enabled) {
                $recommendations[] = [
                    'id' => "enable_waf_{$site->id}",
                    'type' => 'enable_waf',
                    'severity' => 'critical',
                    'severity_score' => 95,
                    'title' => "Enable WAF on {$site->name}",
                    'description' => "Detected {$sqlCount} SQLi and {$xssCount} XSS attempts. WAF is currently disabled.",
                    'impact' => 'Enables Web Application Firewall to filter malicious requests.',
                    'payload' => ['site_id' => $site->id],
                ];
            }

            if ($botCount >= 10 && ! $site->bot_fight_mode) {
                $recommendations[] = [
                    'id' => "enable_bot_fight_{$site->id}",
                    'type' => 'enable_bot_fight',
                    'severity' => 'medium',
                    'severity_score' => 60,
                    'title' => "Enable Bot Fight Mode on {$site->name}",
                    'description' => "Detected {$botCount} bot/scanner requests targeting this site.",
                    'impact' => 'Challenges and blocks automated bot traffic.',
                    'payload' => ['site_id' => $site->id],
                ];
            }
        }

        if ($sqlCount >= 20) {
            $recommendations[] = [
                'id' => 'add_waf_rule_sqli_global',
                'type' => 'add_waf_rule',
                'severity' => 'critical',
                'severity_score' => 98,
                'title' => 'Add global SQLi WAF rule',
                'description' => "Detected {$sqlCount} SQL injection attempts across all sites.",
                'impact' => 'Adds a WAF rule blocking common SQL injection patterns on all active sites.',
                'payload' => [
                    'rule' => [
                        'type' => 'query',
                        'pattern' => '(?i)(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|OR\s+1=1|AND\s+1=1)',
                        'action' => 'block',
                    ],
                    'all_sites' => true,
                ],
            ];
        }

        return $recommendations;
    }

    private function analyzeSiteRateLimits(Collection $events): array
    {
        $recommendations = [];

        $bySite = $events->groupBy('proxy_site_id')->map(fn ($g) => $g->count());

        foreach ($bySite as $siteId => $count) {
            if ($count < self::RATE_LIMIT_THRESHOLD) {
                continue;
            }

            $site = ProxySite::find($siteId);
            if (! $site) {
                continue;
            }

            $currentRps = $site->rate_limit_rps ?? 100;
            $suggestedRps = max(10, (int) ($currentRps * 0.5));

            if ($suggestedRps >= $currentRps) {
                continue;
            }

            $recommendations[] = [
                'id' => "rate_limit_{$siteId}",
                'type' => 'increase_rate_limit',
                'severity' => 'medium',
                'severity_score' => min(75, $count),
                'title' => "Tighten rate limit on {$site->name}",
                'description' => "{$count} security events detected. Current limit: {$currentRps} req/s.",
                'impact' => "Reduces rate limit from {$currentRps} to {$suggestedRps} req/s to throttle attackers.",
                'payload' => ['site_id' => $siteId, 'rate_limit_rps' => $suggestedRps],
            ];
        }

        return $recommendations;
    }

    private function analyzeWafGaps(Collection $events): array
    {
        $recommendations = [];

        $pathEvents = $events->filter(fn ($e) => str_contains($e->request_path ?? '', '.env')
            || str_contains($e->request_path ?? '', 'wp-config')
            || str_contains($e->request_path ?? '', 'xmlrpc'));

        if ($pathEvents->count() >= 3) {
            $sites = ProxySite::where('is_active', true)
                ->where('protect_sensitive_files', false)
                ->get();

            foreach ($sites as $site) {
                $recommendations[] = [
                    'id' => "protect_files_{$site->id}",
                    'type' => 'add_waf_rule',
                    'severity' => 'high',
                    'severity_score' => 80,
                    'title' => "Protect sensitive files on {$site->name}",
                    'description' => "Detected {$pathEvents->count()} probes targeting .env, wp-config, xmlrpc files.",
                    'impact' => 'Blocks access to sensitive configuration files.',
                    'payload' => [
                        'site_id' => $site->id,
                        'rule' => [
                            'type' => 'path',
                            'pattern' => '(?i)(\.env|wp-config|xmlrpc|composer\.json|\.git)',
                            'action' => 'block',
                        ],
                    ],
                ];
            }
        }

        return $recommendations;
    }

    private function buildStats(Collection $events): array
    {
        return [
            'total_events' => $events->count(),
            'unique_ips' => $events->pluck('ip_address')->filter()->unique()->count(),
            'unique_countries' => $events->pluck('country_code')->filter()->unique()->count(),
            'top_type' => $events->groupBy('type')->map(fn ($g) => $g->count())->sort(fn ($a, $b) => $b <=> $a)->keys()->first(),
            'window_days' => self::THREAT_WINDOW_DAYS,
        ];
    }

    private function applyBanIp(array $action): ?array
    {
        $ip = $action['payload']['ip'] ?? null;
        if (! $ip) {
            return null;
        }

        BannedIp::firstOrCreate(
            ['ip_address' => $ip],
            ['reason' => $action['payload']['reason'] ?? 'Policy optimizer']
        );

        return ['type' => 'ban_ip', 'ip' => $ip, 'message' => "IP {$ip} banned."];
    }

    private function applyBlockCountry(array $action): ?array
    {
        $siteId = $action['payload']['site_id'] ?? null;
        $code = $action['payload']['country_code'] ?? null;

        if (! $siteId || ! $code) {
            return null;
        }

        $site = ProxySite::find($siteId);
        if (! $site) {
            return null;
        }

        $denylist = $site->geoip_denylist ?? [];
        if (! in_array($code, $denylist)) {
            $denylist[] = $code;
        }

        $site->update([
            'geoip_denylist' => $denylist,
            'geoip_enabled' => true,
        ]);

        return ['type' => 'block_country', 'site' => $site->name, 'country' => $code];
    }

    private function applyEnableWaf(array $action): ?array
    {
        $site = ProxySite::find($action['payload']['site_id'] ?? null);
        if (! $site) {
            return null;
        }

        $site->update(['waf_enabled' => true]);

        return ['type' => 'enable_waf', 'site' => $site->name];
    }

    private function applyRateLimit(array $action): ?array
    {
        $site = ProxySite::find($action['payload']['site_id'] ?? null);
        if (! $site) {
            return null;
        }

        $site->update(['rate_limit_rps' => $action['payload']['rate_limit_rps']]);

        return ['type' => 'rate_limit', 'site' => $site->name, 'rps' => $action['payload']['rate_limit_rps']];
    }

    private function applyBotFight(array $action): ?array
    {
        $site = ProxySite::find($action['payload']['site_id'] ?? null);
        if (! $site) {
            return null;
        }

        $site->update(['bot_fight_mode' => true]);

        return ['type' => 'bot_fight', 'site' => $site->name];
    }

    private function applyUnderAttack(array $action): ?array
    {
        $site = ProxySite::find($action['payload']['site_id'] ?? null);
        if (! $site) {
            return null;
        }

        $site->update(['under_attack_mode' => true]);

        return ['type' => 'under_attack', 'site' => $site->name];
    }

    private function applyWafRule(array $action): ?array
    {
        $rule = $action['payload']['rule'] ?? null;
        if (! $rule) {
            return null;
        }

        if (! empty($action['payload']['all_sites'])) {
            $sites = ProxySite::where('is_active', true)->get();
        } else {
            $site = ProxySite::find($action['payload']['site_id'] ?? null);
            $sites = $site ? collect([$site]) : collect();
        }

        $applied = [];
        foreach ($sites as $site) {
            $rules = $site->custom_waf_rules ?? [];
            $patterns = array_column($rules, 'pattern');
            if (! in_array($rule['pattern'], $patterns)) {
                $rules[] = $rule;
                $site->update(['custom_waf_rules' => $rules, 'waf_enabled' => true]);
                $applied[] = $site->name;
            }
        }

        return ['type' => 'waf_rule', 'sites' => $applied, 'pattern' => $rule['pattern']];
    }
}
