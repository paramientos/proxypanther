<?php

namespace App\Services;

use App\Models\BannedIp;
use App\Models\ProxySite;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Http;

class CaddyService
{
    protected string $caddyfilePath;

    public function __construct()
    {
        $this->caddyfilePath = config('services.caddy.caddyfile', env('CADDYFILE_PATH', base_path('Caddyfile')));
    }

    public function sync(): bool
    {
        $sites = ProxySite::query()
            ->with(['pageRules'])
            ->where('is_active', true)
            ->get();
        $bannedIps = BannedIp::all();
        $content = $this->renderCaddyfile($sites, $bannedIps);

        $dir = dirname($this->caddyfilePath);
        if (! File::isDirectory($dir)) {
            File::makeDirectory($dir, 0755, true, true);
        }

        try {
            File::put($this->caddyfilePath, $content);
        } catch (\Exception $e) {
            \Log::warning('Caddyfile write failed', ['path' => $this->caddyfilePath, 'message' => $e->getMessage()]);

            return false;
        }

        return $this->reloadCaddy();
    }

    public function renderCaddyfile($sites, $bannedIps): string
    {
        $out = "{\n    admin 0.0.0.0:2019\n    email admin@proxypanther.com\n}\n\n";

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

            // Emergency Shield - I'm Under Attack Mode
            if ($site->under_attack_mode) {
                $html = $this->getChallengeTemplate('Emergency Shield Active', 'High-level infrastructure protection is currently enforced.');
                $out .= "    header Retry-After \"5\"\n";
                $out .= "    header Content-Type \"text/html; charset=utf-8\"\n";
                $out .= "    respond `{$html}` 429\n";
                $out .= "}\n\n";

                continue;
            }

            /* Advanced Rate Limiting (Requires http.ratelimit plugin)
            if ($site->rate_limit_rps > 0) {
                $burst = $site->rate_limit_burst ?: 10;
                $action = $site->rate_limit_action === 'delay' ? 'delay' : 'block';
                $out .= "    # Note: Requires caddy-ratelimit plugin\n";
                $out .= "    # rate_limit {\n";
                $out .= "    #     zone site_{$site->id} {\n";
                $out .= "    #         key {remote_host}\n";
                $out .= "    #         events {$site->rate_limit_rps}\n";
                $out .= "    #         window 1s\n";
                $out .= "    #         burst {$burst}\n";
                $out .= "    #     }\n";
                $out .= "    # }\n";
            }
            */

            // GeoIP - High Priority Shield
            if ($site->geoip_enabled) {
                if ($site->geoip_denylist && \count($site->geoip_denylist) > 0) {
                    $countries = implode(' ', array_map('strtoupper', $site->geoip_denylist));
                    $out .= "    @geo_blocked {\n        maxmind_geolocation {\n";
                    $out .= "            db_path \"/etc/caddy/GeoLite2-Country.mmdb\"\n";
                    $out .= "            allow_countries {$countries}\n        }\n    }\n";
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

            // Performance & Security Hardening
            if ($site->hsts_enabled) {
                $out .= "    header Strict-Transport-Security \"max-age=31536000; includeSubDomains; preload\"\n";
            }
            $out .= "    encode gzip\n";

            // WAF
            if ($site->waf_enabled) {
                if ($site->block_common_bad_bots) {
                    $out .= "    @bad_bots {\n";
                    $out .= "        header_regexp User-Agent \"(?i)(sqlmap|nikto|nmap|zgrab|masscan|burp|metasploit|gobuster|dirbuster|python-requests|curl|wget)\"\n";
                    $out .= "    }\n    error @bad_bots \"Access Denied\" 403\n";
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

                if ($site->bot_fight_mode) {
                    $html = $this->getChallengeTemplate('Bot Fight Mode', 'Behavioral protection is analyzing your request pulse.');
                    $out .= "    @bot_fight {\n";
                    $out .= "        header_regexp User-Agent \"(?i)(headless|selenium|webdriver|puppeteer|zgrab|masscan)\"\n";
                    $out .= "        not remote_ip 1.1.1.1 8.8.8.8\n";
                    $out .= "    }\n";
                    $out .= "    header @bot_fight Retry-After \"10\"\n";
                    $out .= "    header @bot_fight Content-Type \"text/html; charset=utf-8\"\n";
                    $out .= "    error @bot_fight `{$html}` 429\n";
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
                        $out .= "    }\n    error @{$name} \"Blocked by Custom Security Rule\" 403\n";
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
                $out .= "    }\n    error @attacks \"Access Denied by ProxyPanther Advanced WAF\" 403\n\n";

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

            // Cloudflare-style Page Rules (Redirect / Rewrite / Headers)
            foreach ($site->pageRules as $idx => $rule) {
                if (! $rule->is_active) {
                    continue;
                }

                $mn = "pagerule_{$rule->id}";
                $path = $rule->path;

                // Ensure path starts with / and add wildcard if not present for better matching
                if (! str_starts_with($path, '/')) {
                    $path = "/{$path}";
                }
                $matcherPath = str_contains($path, '*') ? $path : "{$path}*";

                switch ($rule->type) {
                    case 'redirect':
                        $out .= "    @{$mn} path {$matcherPath}\n";
                        $out .= "    redir @{$mn} {$rule->value} 301\n";
                        break;
                    case 'rewrite':
                        $out .= "    @{$mn} path {$matcherPath}\n";
                        $out .= "    rewrite @{$mn} {$rule->value}\n";
                        break;
                    case 'header':
                        // Format: "Header-Name: Header-Value"
                        if (str_contains($rule->value, ':')) {
                            [$hName, $hVal] = explode(':', $rule->value, 2);
                            $out .= '    header '.trim($hName).' "'.trim($hVal)."\"\n";
                        }
                        break;
                }
            }

            // Legacy Redirect / Rewrite rules (for backward compatibility)
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

            $out .= $this->renderTrafficFlow($site);

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
                $out .= "        @5xx expression {err.status_code} >= 500\n";
                $out .= "        @4xx expression {err.status_code} >= 400 && {err.status_code} < 500\n";
                $out .= "        respond @5xx \"ProxyPanther Secure Gateway: Error {err.status_code}\" 500\n";
                $out .= "        respond @4xx \"ProxyPanther Secure Gateway: Error {err.status_code}\" 403\n";
                $out .= "        respond \"ProxyPanther Secure Gateway: Error {err.status_code}\" 502\n";
                $out .= "    }\n";
            }

            $out .= "}\n\n";
        }

        return $out;
    }

    protected function renderTrafficFlow(ProxySite $site): string
    {
        $advancedRoutes = $this->activeAdvancedRoutes($site);
        $forwardAuth = $this->forwardAuthConfig($site);

        if ($advancedRoutes === [] && $forwardAuth === null) {
            return $this->renderBackend($site);
        }

        $out = "    route {\n";

        if ($forwardAuth !== null) {
            foreach ($forwardAuth['bypass_routes'] as $idx => $route) {
                $matcher = "forward_auth_bypass_{$idx}";
                $out .= $this->renderRouteMatcher($matcher, $route, 2);
                $out .= "        handle @{$matcher} {\n";
                $out .= $this->renderAdvancedRouteProxy($route, 3);
                $out .= "        }\n";
            }

            $out .= "        forward_auth {$forwardAuth['auth_upstream_url']} {\n";
            $out .= "            uri {$forwardAuth['auth_uri']}\n";

            if ($forwardAuth['copy_headers'] !== []) {
                $out .= '            copy_headers '.implode(' ', $forwardAuth['copy_headers'])."\n";
            }

            if ($forwardAuth['trusted_proxies'] !== []) {
                $out .= '            trusted_proxies '.implode(' ', $forwardAuth['trusted_proxies'])."\n";
            }

            $out .= "        }\n";
        }

        if ($advancedRoutes !== []) {
            foreach ($advancedRoutes as $idx => $route) {
                $matcher = "advanced_route_{$idx}";
                $out .= $this->renderRouteMatcher($matcher, $route, 2);
                $out .= "        handle @{$matcher} {\n";
                $out .= $this->renderAdvancedRouteProxy($route, 3);
                $out .= "        }\n";
            }

            $out .= "        handle {\n";
            $out .= $this->renderBackend($site, 3);
            $out .= "        }\n";
        } else {
            $out .= $this->renderBackend($site, 2);
        }

        $out .= "    }\n";

        return $out;
    }

    protected function renderBackend(ProxySite $site, int $indent = 1): string
    {
        $pad = str_repeat('    ', $indent);
        $inner = str_repeat('    ', $indent + 1);
        $out = '';

        if ($site->backend_type === 'php_fpm') {
            $backend = $site->backend_url;
            if (str_starts_with($backend, '/') && ! str_starts_with($backend, 'unix/')) {
                $backend = "unix/{$backend}";
            }
            $out .= "{$pad}root * {$site->root_path}\n";
            $out .= "{$pad}php_fastcgi {$backend} {\n";
            if ($site->env_vars && \count($site->env_vars) > 0) {
                foreach ($site->env_vars as $k => $v) {
                    $out .= "{$inner}env {$k} \"{$v}\"\n";
                }
            }
            $out .= "{$pad}}\n";

            return $out;
        }

        $backends = preg_split('/[,\s]+/', $site->backend_url, -1, PREG_SPLIT_NO_EMPTY);
        $backendStr = implode(' ', $backends);
        $hasEnv = $site->env_vars && \count($site->env_vars) > 0;
        $hasBackup = ! empty($site->backup_backend_url);
        $hasCB = (bool) $site->circuit_breaker_enabled;

        if ($hasEnv || $hasBackup || \count($backends) > 1 || $hasCB) {
            $out .= "{$pad}reverse_proxy {$backendStr} {\n";
            if (\count($backends) > 1) {
                $out .= "{$inner}lb_policy random\n";
            }
            if ($hasBackup) {
                $out .= "{$inner}lb_policy first\n{$inner}fail_timeout 5s\n{$inner}max_fails 2\n";
                $out .= "{$inner}to {$site->backup_backend_url}\n";
            }
            if ($hasCB) {
                $t = max(1, (int) $site->circuit_breaker_threshold);
                $r = max(5, (int) $site->circuit_breaker_retry_seconds);
                $out .= "{$inner}max_fails {$t}\n{$inner}fail_duration {$r}s\n";
                $out .= "{$inner}unhealthy_status 500 502 503 504\n";
                $out .= "{$inner}health_interval 10s\n{$inner}health_timeout 3s\n";
            }
            if ($hasEnv) {
                foreach ($site->env_vars as $k => $v) {
                    $out .= "{$inner}header_up X-Env-{$k} \"{$v}\"\n";
                }
                $out .= "{$inner}header_down -X-Env-*\n";
            }
            $out .= "{$inner}header_up Host {host}\n{$inner}header_up X-Real-IP {remote_host}\n{$pad}}\n";

            return $out;
        }

        return "{$pad}reverse_proxy {$backendStr}\n";
    }

    protected function renderRouteMatcher(string $name, array $route, int $indent): string
    {
        $pad = str_repeat('    ', $indent);
        $type = $route['matcher_type'] ?? 'path';
        $value = $route['matcher_value'] ?? '';

        if (\is_array($value)) {
            $value = implode(' ', array_filter($value));
        }

        $value = trim((string) $value);
        if ($value === '') {
            $value = '/*';
        }

        return match ($type) {
            'path_prefix' => "{$pad}@{$name} path {$this->pathPrefixMatcher($value)}\n",
            'header' => $this->renderHeaderMatcher($name, $value, $indent),
            default => "{$pad}@{$name} path {$value}\n",
        };
    }

    protected function renderHeaderMatcher(string $name, string $value, int $indent): string
    {
        $pad = str_repeat('    ', $indent);
        $inner = str_repeat('    ', $indent + 1);
        [$header, $expected] = array_pad(explode(':', $value, 2), 2, '*');

        return "{$pad}@{$name} {\n{$inner}header ".trim($header).' "'.trim($expected)."\"\n{$pad}}\n";
    }

    protected function renderAdvancedRouteProxy(array $route, int $indent): string
    {
        $pad = str_repeat('    ', $indent);
        $inner = str_repeat('    ', $indent + 1);
        $upstream = $this->routeUpstream($route);
        $headerUp = $this->normalizeHeaderPairs($route['header_up'] ?? []);
        $preserveHost = (bool) ($route['preserve_host'] ?? false);
        $skipVerify = ($route['transport'] ?? 'http') === 'https_skip_verify';

        if (! $preserveHost && $headerUp === [] && ! $skipVerify) {
            return "{$pad}reverse_proxy {$upstream}\n";
        }

        $out = "{$pad}reverse_proxy {$upstream} {\n";
        if ($preserveHost) {
            $out .= "{$inner}header_up Host {host}\n";
        }
        foreach ($headerUp as $name => $value) {
            $out .= "{$inner}header_up {$name} \"{$value}\"\n";
        }
        if ($skipVerify) {
            $out .= "{$inner}transport http {\n";
            $out .= str_repeat('    ', $indent + 2)."tls_insecure_skip_verify\n";
            $out .= "{$inner}}\n";
        }
        $out .= "{$pad}}\n";

        return $out;
    }

    protected function routeUpstream(array $route): string
    {
        $url = trim((string) ($route['upstream_url'] ?? ''));
        $transport = $route['transport'] ?? 'http';

        if ($transport === 'h2c') {
            return 'h2c://'.preg_replace('~^https?://~', '', $url);
        }

        if ($transport === 'https_skip_verify' && ! str_starts_with($url, 'https://')) {
            return 'https://'.preg_replace('~^https?://~', '', $url);
        }

        return $url;
    }

    protected function activeAdvancedRoutes(ProxySite $site): array
    {
        return collect($site->advanced_routes ?? [])
            ->filter(fn ($route) => \is_array($route) && ($route['is_active'] ?? true) && ! empty($route['upstream_url']))
            ->sortBy(fn ($route) => (int) ($route['priority'] ?? 100))
            ->values()
            ->all();
    }

    protected function forwardAuthConfig(ProxySite $site): ?array
    {
        $config = $site->forward_auth ?? [];
        if (! \is_array($config) || ! ($config['enabled'] ?? false)) {
            return null;
        }

        $authUpstream = trim((string) ($config['auth_upstream_url'] ?? ''));
        if ($authUpstream === '') {
            return null;
        }

        return [
            'auth_upstream_url' => $authUpstream,
            'auth_uri' => trim((string) ($config['auth_uri'] ?? '/')),
            'copy_headers' => $this->normalizeList($config['copy_headers'] ?? []),
            'trusted_proxies' => $this->normalizeList($config['trusted_proxies'] ?? []),
            'bypass_routes' => collect($config['bypass_routes'] ?? [])
                ->filter(fn ($route) => \is_array($route) && ! empty($route['upstream_url']))
                ->values()
                ->all(),
        ];
    }

    protected function normalizeHeaderPairs(array $headers): array
    {
        if (array_is_list($headers)) {
            return collect($headers)
                ->filter(fn ($header) => \is_array($header) && ! empty($header['name']))
                ->mapWithKeys(fn ($header) => [trim((string) $header['name']) => (string) ($header['value'] ?? '')])
                ->all();
        }

        return collect($headers)
            ->mapWithKeys(fn ($value, $key) => [trim((string) $key) => (string) $value])
            ->filter(fn ($value, $key) => $key !== '')
            ->all();
    }

    protected function normalizeList(array|string|null $value): array
    {
        if (\is_string($value)) {
            return preg_split('/[,\s]+/', $value, -1, PREG_SPLIT_NO_EMPTY) ?: [];
        }

        if (! \is_array($value)) {
            return [];
        }

        return array_values(array_filter(array_map('strval', $value)));
    }

    protected function pathPrefixMatcher(string $value): string
    {
        return collect(preg_split('/\s+/', $value, -1, PREG_SPLIT_NO_EMPTY))
            ->map(fn ($path) => str_ends_with($path, '*') ? $path : rtrim($path, '/').'*')
            ->implode(' ');
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
        $adminApi = config('services.caddy.admin_api', 'http://caddy:2019');

        try {
            $caddyfileContent = File::get($this->caddyfilePath);

            $response = Http::timeout(10)
                ->withBody($caddyfileContent, 'text/caddyfile')
                ->post("{$adminApi}/load");

            if ($response->successful()) {
                return true;
            }

            \Log::warning('Caddy reload via API failed', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
        } catch (\Exception $e) {
            \Log::warning('Caddy reload skipped — Caddy not reachable', ['message' => $e->getMessage()]);
        }

        return false;
    }
}
