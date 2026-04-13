<?php

namespace App\Services;

use App\Events\BackendHealthUpdated;
use App\Models\ProxySite;
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
            if ($site->backend_type === 'php_fpm') {
                $status = $this->checkPhpFpm($url);
            } else {
                $status = $this->checkHttp($url);
            }

            if ($status['online']) {
                $isOnline = true;
                break;
            } else {
                $lastError = $status['error'];
            }
        }

        $oldStatus = $site->is_online;
        $site->update([
            'is_online' => $isOnline,
            'last_check_at' => now(),
            'last_error' => $isOnline ? null : $lastError,
        ]);

        if ($oldStatus !== $isOnline) {
            event(new BackendHealthUpdated($site));
        }
    }

    private function checkHttp($url)
    {
        try {
            $response = Http::timeout(5)->get($url);
            return [
                'online' => $response->successful() || $response->status() === 503 || $response->status() === 401,
                'error' => $response->successful() ? null : "HTTP Status: " . $response->status(),
            ];
        } catch (\Exception $e) {
            return [
                'online' => false,
                'error' => $e->getMessage(),
            ];
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
