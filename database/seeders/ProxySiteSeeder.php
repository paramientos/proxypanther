<?php

namespace Database\Seeders;

use App\Models\ProxySite;
use App\Models\SecurityEvent;
use Illuminate\Database\Seeder;

class ProxySiteSeeder extends Seeder
{
    public function run(): void
    {
        $blog = ProxySite::create([
            'name' => 'Main Blog',
            'domain' => 'blog.com',
            'backend_url' => 'http://localhost:8001',
            'ssl_enabled' => true,
            'waf_enabled' => true,
            'rate_limit_rps' => 5,
            'total_requests' => 1250,
            'blocked_requests' => 12,
        ]);

        $app = ProxySite::create([
            'name' => 'Main App',
            'domain' => 'app.com',
            'backend_url' => 'http://localhost:8002',
            'ssl_enabled' => true,
            'waf_enabled' => true,
            'rate_limit_rps' => 10,
            'total_requests' => 4500,
            'blocked_requests' => 89,
        ]);

        SecurityEvent::create([
            'proxy_site_id' => $app->id,
            'type' => 'SQLi',
            'ip_address' => '192.168.1.45',
            'user_agent' => 'Mozilla/5.0 (EvilOS)',
            'request_method' => 'POST',
            'request_path' => '/login',
            'payload' => "email=admin' OR 1=1--",
        ]);

        SecurityEvent::create([
            'proxy_site_id' => $app->id,
            'type' => 'XSS',
            'ip_address' => '10.0.0.12',
            'user_agent' => 'Mozilla/5.0 (HackerBrowser)',
            'request_method' => 'GET',
            'request_path' => '/search?q=<script>alert(1)</script>',
        ]);
    }
}
