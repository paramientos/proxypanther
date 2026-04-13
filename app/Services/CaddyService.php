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
                $caddyfile .= "    # Advanced WAF Protection\n";
                $caddyfile .= "    @attacks {\n";
                $caddyfile .= "        # SQL Injection Patterns\n";
                $caddyfile .= "        query *union*select*\n";
                $caddyfile .= "        query *information_schema*\n";
                $caddyfile .= "        query *sleep(*\n";
                $caddyfile .= "        query *benchmark(*\n";
                $caddyfile .= "        expression {query}.contains(\"' OR 1=1\") || {query}.contains('\" OR 1=1') || {query}.contains('--')\n";
                
                $caddyfile .= "        # XSS Patterns\n";
                $caddyfile .= "        query *<script*\n";
                $caddyfile .= "        query *javascript:*\n";
                $caddyfile .= "        query *onerror=*\n";
                $caddyfile .= "        query *onload=*\n";
                $caddyfile .= "        query *eval(*\n";
                
                $caddyfile .= "        # LFI & Directory Traversal\n";
                $caddyfile .= "        query *../*\n";
                $caddyfile .= "        query */etc/passwd*\n";
                $caddyfile .= "        query */etc/shadow*\n";
                
                $caddyfile .= "        # Malicious Bots & Scanners\n";
                $caddyfile .= "        header_regexp User-Agent (?i)(sqlmap|nikto|nmap|zgrab|masscan|burp|metasploit|gobuster|dirbuster)\n";
                $caddyfile .= "    }\n";
                $caddyfile .= "    respond @attacks \"Access Denied by ProxyPanther Advanced WAF\" 403\n\n";
                
                $caddyfile .= "    # Security Headers\n";
                $caddyfile .= "    header {\n";
                $caddyfile .= "        Strict-Transport-Security \"max-age=31536000; includeSubDomains; preload\"\n";
                $caddyfile .= "        X-Content-Type-Options \"nosniff\"\n";
                $caddyfile .= "        X-Frame-Options \"SAMEORIGIN\"\n";
                $caddyfile .= "        X-XSS-Protection \"1; mode=block\"\n";
                $caddyfile .= "        Referrer-Policy \"strict-origin-when-cross-origin\"\n";
                $caddyfile .= "        Content-Security-Policy \"default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';\"\n";
                $caddyfile .= "        Permissions-Policy \"geolocation=(), microphone=(), camera=()\"\n";
                $caddyfile .= "        -Server\n"; // Hide Caddy version
                $caddyfile .= "        -X-Powered-By\n"; // Hide backend technology
                $caddyfile .= "    }\n\n";
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
                $caddyfile .= "    php_fastcgi {$backend}\n";
                $caddyfile .= "    file_server\n";
            } else {
                $caddyfile .= "    reverse_proxy {$site->backend_url} {\n";
                $caddyfile .= "        header_up Host {host}\n";
                $caddyfile .= "        header_up X-Real-IP {remote_host}\n";
                $caddyfile .= "    }\n";
            }

            if ($site->rate_limit_rps > 0) {
                $caddyfile .= "    # Rate Limit: {$site->rate_limit_rps} rps\n";
            }

            $caddyfile .= "    handle_errors {\n";
            $caddyfile .= "        rewrite * /{err.status_code}.html\n";
            $caddyfile .= "        respond \"ProxyPanther Secure Gateway: Error {err.status_code}\" {err.status_code}\n";
            $caddyfile .= "    }\n";

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
