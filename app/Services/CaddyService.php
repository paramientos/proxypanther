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
                // Basic WAF Protection using expression matcher
                $caddyfile .= "    # Basic WAF Protection\n";
                $caddyfile .= "    @attacks {\n";
                $caddyfile .= "        expression {query}.contains('union') || {query}.contains('select') || {query}.contains('<script')\n";
                $caddyfile .= "        header_regexp User-Agent (?i)(sqlmap|nikto|nmap)\n";
                $caddyfile .= "    }\n";
                $caddyfile .= "    respond @attacks \"Access Denied by ProxyPanther WAF\" 403\n\n";
            }

            if ($site->auth_user && $site->auth_password) {
                $caddyfile .= "    # Auth Proxy\n";
                $caddyfile .= "    basic_auth {\n";
                $caddyfile .= "        {$site->auth_user} " . password_hash($site->auth_password, PASSWORD_DEFAULT) . "\n";
                $caddyfile .= "    }\n";
            }

            $caddyfile .= "    reverse_proxy {$site->backend_url} {\n";
            $caddyfile .= "        header_up Host {host}\n";
            $caddyfile .= "        header_up X-Real-IP {remote_host}\n";
            $caddyfile .= "    }\n";

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
