<?php

namespace App\Services;

use App\Models\BannedIp;
use App\Models\ProxySite;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Process;

class CaddyService
{
    protected string $caddyfilePath;

    public function __construct()
    {
        $this->caddyfilePath = base_path('Caddyfile');
    }

    public function sync(): bool
    {
        $sites = ProxySite::query()->where('is_active', true)->get();
        $bannedIps = BannedIp::all();
        $content = $this->generateCaddyfile($sites, $bannedIps);

        File::put($this->caddyfilePath, $content);

        return $this->reloadCaddy();
    }

    protected function generateCaddyfile($sites, $bannedIps): string
    {
        $out = "{\n    # Global Options\n    email admin@proxypanther.com\n}\n\n";

        $out .= "(common_security_headers) {\n    header {\n";
        $out .= "        Strict-Transport-Security \"max-age=31536000; includeSubDomains; preload\"\n";
        $out .= "        X-Content-Type-Options \"nosniff\"\n";
        $out .= "        X-Frame-Options \"SAMEORIGIN\"\n";
        $out .= "        X-XSS-Protection \"1; mode=block\"\n";
        $out .= "        Referrer-Policy \"strict-origin-when-cross-origin\"\n";
        $out .= "        Content-Security-Policy \"default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';\"\n";
        $out .= "        Permissions-Policy \"geolocation=(), microphone=(), camera=()\"\n";
        $out .= "        -Server\n        -X-Powered-By\n    }\n}\n\n";

        if ($bannedIps->count() > 0) {
            $ips = $bannedIps->pluck('ip_address')->implode(' ');
            $out .= "(blacklist) {\n";
            $out .= "    @banned_ips remote_ip {$ips}\n";
            $out .= "    respond @banned_ips \"Access Denied by ProxyPanther Global Blacklist\" 403\n";
            $out .= "}\n\n";
        }

        foreach ($sites as $site) {
            $prefix = $site->ssl_enabled ? '' : 'http://';
            $out .= "{$prefix}{$site->domain} {\n";

            // Infrastructure Debug Headers
            $out .= "    header X-ProxyPanther-Gateway \"Secure-Alpha\"\n";

            // GeoIP - High Priority Shield
            if ($site->geoip_enabled) {
                if ($site->geoip_denylist && \count($site->geoip_denylist) > 0) {
                    $countries = implode(' ', array_map('strtoupper', $site->geoip_denylist));
                    $out .= "    @geo_blocked {\n        maxmind_geolocation {\n";
                    $out .= "            db_path \"/etc/caddy/GeoLite2-Country.mmdb\"\n";
                    $out .= "            deny_countries {$countries}\n        }\n    }\n";
                    $out .= "    respond @geo_blocked \"Access Denied: Your region is restricted by ProxyPanther Global SOC.\" 403\n\n";
                }
                if ($site->geoip_allowlist && \count($site->geoip_allowlist) > 0) {
                    $countries = implode(' ', array_map('strtoupper', $site->geoip_allowlist));
                    $out .= "    @geo_not_allowed {\n        not maxmind_geolocation {\n";
                    $out .= "            db_path \"/etc/caddy/GeoLite2-Country.mmdb\"\n";
                    $out .= "            allow_countries {$countries}\n        }\n    }\n";
                    $out .= "    respond @geo_not_allowed \"Access Denied: Your region is not authorized for access.\" 403\n\n";
                }
            }

            if ($site->is_maintenance) {
                $msg = $site->maintenance_message ?: 'Site is under maintenance. Please try again later.';
                $out .= "    respond \"{$msg}\" 503\n}\n\n";

                continue;
            }

            // Logging
            $logPath = storage_path("logs/caddy-{$site->id}.log");
            $out .= "    log {\n        output file {$logPath}\n        format json\n    }\n\n";

            if ($bannedIps->count() > 0) {
                $out .= "    import blacklist\n";
            }

            // Sensitive file protection
            if ($site->protect_sensitive_files) {
                $out .= "    @sensitive_paths {\n";
                $out .= "        path /.env* /.git* /.svn* /wp-config.php /config.php /composer.json /composer.lock\n";
                $out .= "    }\n";
                $out .= "    respond @sensitive_paths \"Access to sensitive system files is forbidden.\" 403\n\n";
            }

            // WAF
            if ($site->waf_enabled) {
                if ($site->block_common_bad_bots) {
                    $out .= "    @bad_bots {\n";
                    $out .= "        header_regexp User-Agent \"(?i)(sqlmap|nikto|nmap|zgrab|masscan|burp|metasploit|gobuster|dirbuster|python-requests|curl|wget)\"\n";
                    $out .= "    }\n    respond @bad_bots \"Access Denied\" 403\n";
                }

                if ($site->bot_challenge_force) {
                    $html = $this->getChallengeTemplate('Security Check Required', 'Performing high-level connection analysis.');
                    $out .= "    header Retry-After \"15\"\n";
                    $out .= "    header Content-Type \"text/html; charset=utf-8\"\n";
                    $out .= "    respond `{$html}` 429\n";
                } elseif ($site->bot_challenge_mode) {
                    $html = $this->getChallengeTemplate('Bot Challenge', 'Verification required for potential automation.');
                    $out .= "    @bot_challenge {\n        header_regexp User-Agent \"(?i)(bot|crawler|spider|python-requests|curl|wget|scrapy|httpclient)\"\n    }\n";
                    $out .= "    header @bot_challenge Retry-After \"15\"\n";
                    $out .= "    header @bot_challenge Content-Type \"text/html; charset=utf-8\"\n";
                    $out .= "    respond @bot_challenge `{$html}` 429\n";
                }

                // Per-route policies
                if (\is_array($site->route_policies)) {
                    foreach ($site->route_policies as $idx => $policy) {
                        $path = trim((string) ($policy['path'] ?? ''));
                        if ($path === '') {
                            continue;
                        }
                        $pp = str_ends_with($path, '*') ? $path : "{$path}*";

                        if (! empty($policy['bot_challenge_mode'])) {
                            $html = $this->getChallengeTemplate('Security Challenge', "Verification required for path: {$path}");
                            $out .= "    @route_bot_{$idx} {\n        path {$pp}\n        header_regexp User-Agent \"(?i)(bot|crawler|spider)\"\n    }\n";
                            $out .= "    header @route_bot_{$idx} Retry-After \"15\"\n";
                            $out .= "    header @route_bot_{$idx} Content-Type \"text/html; charset=utf-8\"\n";
                            $out .= "    respond @route_bot_{$idx} `{$html}` 429\n";
                        }
                        if (! empty($policy['rate_limit_rps'])) {
                            $out .= "    @route_rate_{$idx} path {$pp}\n";
                            $out .= "    header @route_rate_{$idx} X-ProxyPanther-Policy-Limit \"{$policy['rate_limit_rps']}rps\"\n";
                        }
                    }
                }

                // Custom WAF rules
                if ($site->custom_waf_rules && \count($site->custom_waf_rules) > 0) {
                    foreach ($site->custom_waf_rules as $idx => $rule) {
                        $name = 'custom_rule_'.($idx + 1);
                        $pattern = addslashes($rule['pattern']);
                        $out .= "    @{$name} {\n";
                        if ($rule['type'] === 'path') {
                            $out .= "        path {$pattern}\n";
                        } elseif ($rule['type'] === 'query') {
                            $out .= "        expression {query}.contains('{$pattern}')\n";
                        } elseif ($rule['type'] === 'header') {
                            $out .= "        header_regexp {$rule['header_name']} \"{$pattern}\"\n";
                        }
                        $out .= "    }\n    respond @{$name} \"Blocked by Custom Security Rule\" 403\n";
                    }
                }

                // Built-in WAF patterns
                $out .= "    @attacks {\n";
                $out .= "        expression {query}.contains('union') && {query}.contains('select')\n";
                $out .= "        expression {query}.contains('information_schema')\n";
                $out .= "        expression {query}.contains('sleep(')\n";
                $out .= "        expression {query}.contains('benchmark(')\n";
                $out .= "        expression {query}.contains('<script')\n";
                $out .= "        expression {query}.contains('javascript:')\n";
                $out .= "        expression {query}.contains('onerror=')\n";
                $out .= "        expression {query}.contains('../')\n";
                $out .= "        expression {query}.contains('/etc/passwd')\n";
                $out .= "        header_regexp User-Agent (?i)(sqlmap|nikto|nmap|zgrab|masscan|burp|metasploit|gobuster|dirbuster)\n";
                $out .= "    }\n    respond @attacks \"Access Denied by ProxyPanther Advanced WAF\" 403\n\n";

                $out .= "    import common_security_headers\n";

                if ($site->ip_denylist && \count($site->ip_denylist) > 0) {
                    $ips = implode(' ', $site->ip_denylist);
                    $out .= "    @denylist remote_ip {$ips}\n    abort @denylist\n";
                }
                if ($site->ip_allowlist && \count($site->ip_allowlist) > 0) {
                    $ips = implode(' ', $site->ip_allowlist);
                    $out .= "    @allowlist not remote_ip {$ips}\n    abort @allowlist\n";
                }
            }

            // Basic Auth
            if ($site->auth_user && $site->auth_password) {
                $hash = password_hash($site->auth_password, PASSWORD_DEFAULT);
                $out .= "    basic_auth {\n        {$site->auth_user} {$hash}\n    }\n";
            }

            // Redirect / Rewrite rules
            if ($site->redirect_rules && \count($site->redirect_rules) > 0) {
                foreach ($site->redirect_rules as $idx => $rule) {
                    $from = trim((string) ($rule['from'] ?? ''));
                    $to = trim((string) ($rule['to'] ?? ''));
                    if ($from === '' || $to === '') {
                        continue;
                    }
                    $type = $rule['type'] ?? 'permanent';
                    $mn = "redirect_{$idx}";

                    match ($type) {
                        'permanent' => $out .= "    @{$mn} path {$from}\n    redir @{$mn} {$to} 301\n",
                        'temporary' => $out .= "    @{$mn} path {$from}\n    redir @{$mn} {$to} 302\n",
                        'rewrite' => $out .= "    @{$mn} path {$from}\n    rewrite @{$mn} {$to}\n",
                        'strip_prefix' => $out .= "    handle_path {$from}* {\n        rewrite * {$to}{path}\n    }\n",
                        default => null,
                    };
                }
            }

            // Backend
            if ($site->backend_type === 'php_fpm') {
                $backend = $site->backend_url;
                if (str_starts_with($backend, '/') && ! str_starts_with($backend, 'unix/')) {
                    $backend = "unix/{$backend}";
                }
                $out .= "    root * {$site->root_path}\n";
                $out .= "    php_fastcgi {$backend} {\n";
                if ($site->env_vars && \count($site->env_vars) > 0) {
                    foreach ($site->env_vars as $k => $v) {
                        $out .= "        env {$k} \"{$v}\"\n";
                    }
                }
                $out .= "    }\n";
            } else {
                $backends = preg_split('/[,\s]+/', $site->backend_url, -1, PREG_SPLIT_NO_EMPTY);
                $backendStr = implode(' ', $backends);
                $hasEnv = $site->env_vars && \count($site->env_vars) > 0;
                $hasBackup = ! empty($site->backup_backend_url);
                $hasCB = (bool) $site->circuit_breaker_enabled;

                if ($hasEnv || $hasBackup || \count($backends) > 1 || $hasCB) {
                    $out .= "    reverse_proxy {$backendStr} {\n";
                    if (\count($backends) > 1) {
                        $out .= "        lb_policy random\n";
                    }
                    if ($hasBackup) {
                        $out .= "        lb_policy first\n        fail_timeout 5s\n        max_fails 2\n";
                        $out .= "        to {$site->backup_backend_url}\n";
                    }
                    if ($hasCB) {
                        $t = max(1, (int) $site->circuit_breaker_threshold);
                        $r = max(5, (int) $site->circuit_breaker_retry_seconds);
                        $out .= "        max_fails {$t}\n        fail_duration {$r}s\n";
                        $out .= "        unhealthy_status 500 502 503 504\n";
                        $out .= "        health_interval 10s\n        health_timeout 3s\n";
                    }
                    if ($hasEnv) {
                        foreach ($site->env_vars as $k => $v) {
                            $out .= "        header_up X-Env-{$k} \"{$v}\"\n";
                        }
                        $out .= "        header_down -X-Env-*\n";
                    }
                    $out .= "        header_up Host {host}\n        header_up X-Real-IP {remote_host}\n    }\n";
                } else {
                    $out .= "    reverse_proxy {$backendStr}\n";
                }
            }

            // Header manipulation rules
            if ($site->header_rules && \count($site->header_rules) > 0) {
                foreach ($site->header_rules as $rule) {
                    $action = $rule['action'] ?? 'set';
                    $direction = $rule['direction'] ?? 'response';
                    $name = trim((string) ($rule['name'] ?? ''));
                    $value = trim((string) ($rule['value'] ?? ''));
                    if ($name === '') {
                        continue;
                    }
                    $directive = $direction === 'request' ? 'header_up' : 'header';
                    if ($action === 'remove') {
                        $out .= "    {$directive} -{$name}\n";
                    } elseif ($action === 'add') {
                        $out .= "    {$directive} +{$name} \"{$value}\"\n";
                    } else {
                        $out .= "    {$directive} {$name} \"{$value}\"\n";
                    }
                }
            }

            if ($site->cache_enabled) {
                $out .= "    header >Cache-Control \"public, max-age={$site->cache_ttl}\"\n";
            }

            // Custom error pages
            if ($site->custom_error_403 || $site->custom_error_503) {
                $out .= "    handle_errors {\n";
                if ($site->custom_error_403) {
                    $out .= "        @403 expression {err.status_code} == 403\n";
                    $out .= "        handle @403 {\n            respond `{$site->custom_error_403}` 403\n        }\n";
                }
                if ($site->custom_error_503) {
                    $out .= "        @503 expression {err.status_code} == 503\n";
                    $out .= "        handle @503 {\n            respond `{$site->custom_error_503}` 503\n        }\n";
                }
                $out .= "    }\n";
            } else {
                $out .= "    handle_errors {\n";
                $out .= "        respond \"ProxyPanther Secure Gateway: Error {err.status_code}\" {err.status_code}\n";
                $out .= "    }\n";
            }

            $out .= "}\n\n";
        }

        return $out;
    }

    /**
     * Fetch SSL certificate info from Caddy Admin API.
     */
    private function getChallengeTemplate(string $title, string $message): string
    {
        return '<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>'.$title.' | ProxyPanther</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap" rel="stylesheet">
    <style>
        body { background: #050508; color: #fff; font-family: \'Inter\', sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; overflow: hidden; }
        .card { background: #0c0d12; border: 1px solid rgba(255,255,255,0.08); padding: 40px; border-radius: 20px; text-align: center; max-width: 400px; width: 90%; box-shadow: 0 20px 50px rgba(0,0,0,0.5); }
        .icon { width: 64px; height: 64px; background: #6366f1; border-radius: 16px; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; box-shadow: 0 0 30px rgba(99,102,241,0.4); }
        h1 { font-size: 24px; font-weight: 700; margin: 0 0 12px; letter-spacing: -0.02em; }
        p { color: #888; font-size: 14px; line-height: 1.6; margin: 0 0 32px; }
        .progress-container { background: rgba(255,255,255,0.05); height: 6px; border-radius: 3px; overflow: hidden; position: relative; }
        .progress-bar { background: #6366f1; height: 100%; width: 0%; transition: width 15s linear; }
        .counter { font-size: 11px; color: #6366f1; font-weight: 700; margin-top: 16px; display: block; text-transform: uppercase; letter-spacing: 0.1em; }
    </style>
</head>
<body onload="setTimeout(() => document.getElementById(\'bar\').style.width = \'100%\', 50)">
    <div class="card">
        <div class="icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        </div>
        <h1>'.$title.'</h1>
        <p>'.$message.'. Successive requests will be allowed shortly.</p>
        <div class="progress-container">
            <div id="bar" class="progress-bar"></div>
        </div>
        <span id="timer" class="counter">Analyzing Connection...</span>
    </div>
    <script>
        let count = 15;
        const int = setInterval(() => {
            count--;
            if(count <= 0) {
                clearInterval(int);
                window.location.reload();
            }
        }, 1000);
    </script>
</body>
</html>';
    }

    public function getSslCertificates(): array
    {
        try {
            $response = Http::timeout(3)->get('http://localhost:2019/pki/ca/local/certificates');
            if ($response->successful()) {
                return $response->json() ?? [];
            }
        } catch (\Exception) {
        }

        try {
            $config = Http::timeout(3)->get('http://localhost:2019/config/');
            if ($config->successful()) {
                return ['raw_config' => $config->json()];
            }
        } catch (\Exception) {
        }

        return [];
    }

    protected function reloadCaddy(): bool
    {
        $result = Process::run("caddy reload --config {$this->caddyfilePath}");

        return $result->successful();
    }
}
