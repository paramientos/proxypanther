<?php

namespace App\Services;

use App\Models\ProxySite;
use App\Models\BannedIp;
use Illuminate\Support\Facades\File;
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
        $sites = ProxySite::where('is_active', true)->get();
        $bannedIps = BannedIp::all();
        $content = $this->generateCaddyfile($sites, $bannedIps);

        File::put($this->caddyfilePath, $content);

        return $this->reloadCaddy();
    }

    protected function generateCaddyfile($sites, $bannedIps): string
    {
        $caddyfile = "{
    # Global Options
    email admin@proxypanther.com
}

(common_security_headers) {
    header {
        Strict-Transport-Security \"max-age=31536000; includeSubDomains; preload\"
        X-Content-Type-Options \"nosniff\"
        X-Frame-Options \"SAMEORIGIN\"
        X-XSS-Protection \"1; mode=block\"
        Referrer-Policy \"strict-origin-when-cross-origin\"
        Content-Security-Policy \"default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';\"
        Permissions-Policy \"geolocation=(), microphone=(), camera=()\"
        -Server
        -X-Powered-By
    }
}

";

        // Global IP Blacklist
        if ($bannedIps->count() > 0) {
            $ips = $bannedIps->pluck('ip_address')->implode(' ');
            $caddyfile .= "# Global IP Blacklist\n";
            $caddyfile .= "(blacklist) {\n";
            $caddyfile .= "    @banned_ips remote_ip {$ips}\n";
            $caddyfile .= "    respond @banned_ips \"Access Denied by ProxyPanther Global Blacklist\" 403\n";
            $caddyfile .= "}\n\n";
        }

        foreach ($sites as $site) {
            $prefix = $site->ssl_enabled ? "" : "http://";
            $caddyfile .= "{$prefix}{$site->domain} {\n";
            
            if ($site->is_maintenance) {
                $msg = $site->maintenance_message ?: "Site is under maintenance. Please try again later.";
                $caddyfile .= "    respond \"{$msg}\" 503\n";
                $caddyfile .= "}\n\n";
                continue;
            }

            // Enable Logging for Statistics
            $logPath = storage_path("logs/caddy-{$site->id}.log");
            $caddyfile .= "    log {\n";
            $caddyfile .= "        output file {$logPath}\n";
            $caddyfile .= "        format json\n";
            $caddyfile .= "    }\n\n";
            
            if ($bannedIps->count() > 0) {
                $caddyfile .= "    import blacklist\n";
            }

            if ($site->protect_sensitive_files) {
                $caddyfile .= "    # Protect Sensitive Files\n";
                $caddyfile .= "    @sensitive_paths {\n";
                $caddyfile .= "        path /.env* /.git* /.svn* /wp-config.php /config.php /composer.json /composer.lock\n";
                $caddyfile .= "    }\n";
                $caddyfile .= "    respond @sensitive_paths \"Access to sensitive system files is forbidden.\" 403\n\n";
            }

            if ($site->waf_enabled) {
                // Advanced WAF Protection
                if ($site->block_common_bad_bots) {
                    $caddyfile .= "    @bad_bots {\n";
                    $caddyfile .= "        header_regexp User-Agent \"(?i)(sqlmap|nikto|nmap|zgrab|masscan|burp|metasploit|gobuster|dirbuster|python-requests|curl|wget)\"\n";
                    $caddyfile .= "    }\n";
                    $caddyfile .= "    respond @bad_bots \"Access Denied\" 403\n";
                }

                // Custom User-Defined WAF Rules
                if ($site->custom_waf_rules && count($site->custom_waf_rules) > 0) {
                    foreach ($site->custom_waf_rules as $index => $rule) {
                        $name = "custom_rule_" . ($index + 1);
                        $pattern = addslashes($rule['pattern']);
                        $caddyfile .= "    @{$name} {\n";
                        if ($rule['type'] === 'path') {
                            $caddyfile .= "        path {$pattern}\n";
                        } elseif ($rule['type'] === 'query') {
                            $caddyfile .= "        expression {query}.contains('{$pattern}')\n";
                        } elseif ($rule['type'] === 'header') {
                            $caddyfile .= "        header_regexp {$rule['header_name']} \"{$pattern}\"\n";
                        }
                        $caddyfile .= "    }\n";
                        $caddyfile .= "    respond @{$name} \"Blocked by Custom Security Rule\" 403\n";
                    }
                }
                
                $caddyfile .= "    # Advanced WAF Patterns\n";
                $caddyfile .= "    @attacks {\n";
                $caddyfile .= "        # SQL Injection Patterns\n";
                $caddyfile .= "        expression {query}.contains('union') && {query}.contains('select')\n";
                $caddyfile .= "        expression {query}.contains('information_schema')\n";
                $caddyfile .= "        expression {query}.contains('sleep(')\n";
                $caddyfile .= "        expression {query}.contains('benchmark(')\n";
                $caddyfile .= "        expression {query}.contains(\"' OR 1=1\") || {query}.contains('\" OR 1=1') || {query}.contains('--')\n";
                
                $caddyfile .= "        # XSS Patterns\n";
                $caddyfile .= "        expression {query}.contains('<script')\n";
                $caddyfile .= "        expression {query}.contains('javascript:')\n";
                $caddyfile .= "        expression {query}.contains('onerror=')\n";
                $caddyfile .= "        expression {query}.contains('onload=')\n";
                $caddyfile .= "        expression {query}.contains('eval(')\n";
                
                $caddyfile .= "        # LFI & Directory Traversal\n";
                $caddyfile .= "        expression {query}.contains('../')\n";
                $caddyfile .= "        expression {query}.contains('/etc/passwd')\n";
                $caddyfile .= "        expression {query}.contains('/etc/shadow')\n";
                
                $caddyfile .= "        # Malicious Bots & Scanners\n";
                $caddyfile .= "        header_regexp User-Agent (?i)(sqlmap|nikto|nmap|zgrab|masscan|burp|metasploit|gobuster|dirbuster)\n";
                $caddyfile .= "    }\n";
                $caddyfile .= "    respond @attacks \"Access Denied by ProxyPanther Advanced WAF\" 403\n\n";
                
                $caddyfile .= "    import common_security_headers\n";

                // Advanced ACL: Denylist
                if ($site->ip_denylist && count($site->ip_denylist) > 0) {
                    $ips = implode(' ', $site->ip_denylist);
                    $caddyfile .= "    @denylist remote_ip {$ips}\n";
                    $caddyfile .= "    abort @denylist\n";
                }

                // Advanced ACL: Allowlist
                if ($site->ip_allowlist && count($site->ip_allowlist) > 0) {
                    $ips = implode(' ', $site->ip_allowlist);
                    $caddyfile .= "    @allowlist not remote_ip {$ips}\n";
                    $caddyfile .= "    abort @allowlist\n";
                }
            }

            if ($site->auth_user && $site->auth_password) {
                $caddyfile .= "    # Auth Proxy\n";
                $caddyfile .= "    basic_auth {\n";
                $caddyfile .= "        {$site->auth_user} " . password_hash($site->auth_password, PASSWORD_DEFAULT) . "\n";
                $caddyfile .= "    }\n";
            }

            if ($site->backend_type === 'php_fpm') {
                $backend = $site->backend_url;
                if (str_starts_with($backend, '/') && !str_starts_with($backend, 'unix/')) {
                    $backend = "unix/{$backend}";
                }
                $caddyfile .= "    root * {$site->root_path}\n";
                $caddyfile .= "    php_fastcgi {$backend} {\n";
                
                // Inject .env variables
                if ($site->env_vars && count($site->env_vars) > 0) {
                    foreach ($site->env_vars as $key => $value) {
                        $caddyfile .= "        env {$key} \"{$value}\"\n";
                    }
                }
                
                $caddyfile .= "    }\n";
            } elseif ($site->backend_type === 'proxy') {
                $backends = preg_split('/[,\s]+/', $site->backend_url, -1, PREG_SPLIT_NO_EMPTY);
                $backendStr = implode(' ', $backends);
                
                $hasEnvVars = $site->env_vars && count($site->env_vars) > 0;
                $hasBackup = !empty($site->backup_backend_url);
                $hasMultiple = count($backends) > 1;

                if ($hasEnvVars || $hasBackup || $hasMultiple) {
                    $caddyfile .= "    reverse_proxy {$backendStr} {\n";
                    
                    if ($hasMultiple) {
                        $caddyfile .= "        lb_policy random\n";
                    }

                    if ($hasBackup) {
                        $caddyfile .= "        lb_policy first\n";
                        $caddyfile .= "        fail_timeout 5s\n";
                        $caddyfile .= "        max_fails 2\n";
                        $caddyfile .= "        to {$site->backup_backend_url}\n";
                    }

                    if ($hasEnvVars) {
                        foreach ($site->env_vars as $key => $value) {
                            $caddyfile .= "        header_up X-Env-{$key} \"{$value}\"\n";
                        }
                        // Security: Don't leak injected env vars back to the client
                        $caddyfile .= "        header_down -X-Env-*\n";
                    }

                    $caddyfile .= "        header_up Host {host}\n";
                    $caddyfile .= "        header_up X-Real-IP {remote_host}\n";
                    $caddyfile .= "    }\n";
                } else {
                    $caddyfile .= "    reverse_proxy {$backendStr}\n";
                }
            }

            if ($site->rate_limit_rps > 0) {
                $caddyfile .= "    # Rate Limit: {$site->rate_limit_rps} rps\n";
            }

            if ($site->cache_enabled) {
                $caddyfile .= "    # Smart Caching\n";
                $caddyfile .= "    header >Cache-Control \"public, max-age={$site->cache_ttl}\"\n";
            }

            // Custom Error Handling
            if ($site->custom_error_403 || $site->custom_error_503) {
                $caddyfile .= "    handle_errors {\n";
                if ($site->custom_error_403) {
                    $caddyfile .= "        @403 expression {err.status_code} == 403\n";
                    $caddyfile .= "        handle @403 {\n";
                    $caddyfile .= "            respond `{$site->custom_error_403}` 403\n";
                    $caddyfile .= "        }\n";
                }
                if ($site->custom_error_503) {
                    $caddyfile .= "        @503 expression {err.status_code} == 503\n";
                    $caddyfile .= "        handle @503 {\n";
                    $caddyfile .= "            respond `{$site->custom_error_503}` 503\n";
                    $caddyfile .= "        }\n";
                }
                $caddyfile .= "    }\n";
            } else {
                $caddyfile .= "    handle_errors {\n";
                $caddyfile .= "        rewrite * /{err.status_code}.html\n";
                $caddyfile .= "        respond \"ProxyPanther Secure Gateway: Error {err.status_code}\" {err.status_code}\n";
                $caddyfile .= "    }\n";
            }

            $caddyfile .= "}\n\n";
        }

        return $caddyfile;
    }

    protected function reloadCaddy(): bool
    {
        // Try to reload caddy
        // In a real environment, this would be 'caddy reload' or 'frankenphp reload'
        $result = Process::run('caddy reload --config ' . $this->caddyfilePath);
        
        return $result->successful();
    }
}
