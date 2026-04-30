<?php

use App\Models\ProxySite;
use App\Services\CaddyService;

it('renders ordered advanced h2c routes before the fallback backend', function () {
    ProxySite::create([
        'name' => 'NetBird',
        'domain' => 'netbird.example.com',
        'backend_url' => 'http://netbird-dashboard:80',
        'waf_enabled' => false,
        'protect_sensitive_files' => false,
        'advanced_routes' => [
            [
                'name' => 'gRPC',
                'priority' => 10,
                'matcher_type' => 'path',
                'matcher_value' => '/signalexchange.SignalExchange/* /management.ManagementService/*',
                'upstream_url' => 'netbird-server:80',
                'transport' => 'h2c',
                'is_active' => true,
            ],
            [
                'name' => 'HTTP API',
                'priority' => 20,
                'matcher_type' => 'path',
                'matcher_value' => '/relay* /ws-proxy/* /api/* /oauth2/*',
                'upstream_url' => 'http://netbird-server:80',
                'transport' => 'http',
                'is_active' => true,
            ],
        ],
    ]);

    $caddyfile = app(CaddyService::class)->renderCaddyfile(ProxySite::with('pageRules')->get(), collect());

    expect($caddyfile)
        ->toContain('@advanced_route_0 path /signalexchange.SignalExchange/* /management.ManagementService/*')
        ->toContain('reverse_proxy h2c://netbird-server:80')
        ->toContain('@advanced_route_1 path /relay* /ws-proxy/* /api/* /oauth2/*')
        ->toContain("handle {\n            reverse_proxy http://netbird-dashboard:80\n        }");
});

it('renders forward auth after bypass routes and before protected backends', function () {
    ProxySite::create([
        'name' => 'Protected App',
        'domain' => 'dash.example.com',
        'backend_url' => 'http://app:7575',
        'waf_enabled' => false,
        'protect_sensitive_files' => false,
        'forward_auth' => [
            'enabled' => true,
            'auth_upstream_url' => 'http://authentik:9000',
            'auth_uri' => '/outpost.goauthentik.io/auth/caddy',
            'copy_headers' => ['X-Authentik-Username', 'X-Authentik-Email'],
            'trusted_proxies' => ['private_ranges'],
            'bypass_routes' => [
                [
                    'matcher_type' => 'path',
                    'matcher_value' => '/outpost.goauthentik.io/*',
                    'upstream_url' => 'http://authentik:9000',
                    'transport' => 'http',
                ],
            ],
        ],
    ]);

    $caddyfile = app(CaddyService::class)->renderCaddyfile(ProxySite::with('pageRules')->get(), collect());

    expect($caddyfile)
        ->toContain('@forward_auth_bypass_0 path /outpost.goauthentik.io/*')
        ->toContain('forward_auth http://authentik:9000')
        ->toContain('uri /outpost.goauthentik.io/auth/caddy')
        ->toContain('copy_headers X-Authentik-Username X-Authentik-Email')
        ->toContain('trusted_proxies private_ranges')
        ->toContain('reverse_proxy http://app:7575');

    expect(strpos($caddyfile, '@forward_auth_bypass_0'))->toBeLessThan(strpos($caddyfile, 'forward_auth http://authentik:9000'));
    expect(strpos($caddyfile, 'forward_auth http://authentik:9000'))->toBeLessThan(strpos($caddyfile, 'reverse_proxy http://app:7575'));
});
