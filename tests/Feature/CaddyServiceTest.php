<?php

use App\Http\Controllers\ProxySiteController;
use App\Models\ProxySite;
use App\Services\CaddyService;

it('renders Cloudflare DNS challenge when enabled', function () {
    config(['services.caddy.cloudflare_dns' => true]);

    ProxySite::create([
        'name' => 'DNS Challenge App',
        'domain' => 'dns.example.com',
        'backend_url' => 'http://app:8000',
        'ssl_enabled' => true,
        'waf_enabled' => false,
        'protect_sensitive_files' => false,
    ]);

    $caddyfile = app(CaddyService::class)->renderCaddyfile(ProxySite::with('pageRules')->get(), collect());

    expect($caddyfile)
        ->toContain('(cloudflare_tls)')
        ->toContain('dns cloudflare {env.CLOUDFLARE_API_TOKEN}')
        ->toContain("dns.example.com {\n    import cloudflare_tls");
});

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

it('renders advanced route upstream header removals inside the reverse proxy block', function () {
    ProxySite::create([
        'name' => 'Header Removal App',
        'domain' => 'headers.example.com',
        'backend_url' => 'http://fallback:8080',
        'waf_enabled' => false,
        'protect_sensitive_files' => false,
        'advanced_routes' => [
            [
                'name' => 'Auth Outpost',
                'priority' => 10,
                'matcher_type' => 'path',
                'matcher_value' => '/outpost.goauthentik.io/*',
                'upstream_url' => 'http://authentik:9000',
                'transport' => 'http',
                'header_up' => [
                    ['name' => 'X-Forwarded-User', 'action' => 'remove'],
                    ['name' => 'X-ProxyPanther-Route', 'value' => 'auth'],
                ],
                'is_active' => true,
            ],
        ],
    ]);

    $caddyfile = app(CaddyService::class)->renderCaddyfile(ProxySite::with('pageRules')->get(), collect());

    expect($caddyfile)->toContain(<<<'CADDY'
        handle @advanced_route_0 {
            reverse_proxy http://authentik:9000 {
                header_up -X-Forwarded-User
                header_up X-ProxyPanther-Route "auth"
            }
        }
CADDY);
});

it('renders advanced respond routes without requiring an upstream backend', function () {
    ProxySite::create([
        'name' => 'Fallback Respond App',
        'domain' => 'fallback.example.com',
        'backend_url' => 'http://backend:8080',
        'waf_enabled' => false,
        'protect_sensitive_files' => false,
        'advanced_routes' => [
            [
                'name' => 'Explicit API Backend',
                'priority' => 10,
                'matcher_type' => 'path',
                'matcher_value' => '/api/*',
                'action' => 'reverse_proxy',
                'upstream_url' => 'http://api:8080',
                'transport' => 'http',
                'is_active' => true,
            ],
            [
                'name' => 'Catch-all Not Found',
                'priority' => 999,
                'matcher_type' => 'path',
                'matcher_value' => '/*',
                'action' => 'respond',
                'respond_body' => 'Not found',
                'respond_status' => 404,
                'is_active' => true,
            ],
        ],
    ]);

    $caddyfile = app(CaddyService::class)->renderCaddyfile(ProxySite::with('pageRules')->get(), collect());

    expect($caddyfile)
        ->toContain("@advanced_route_1 path /*\n")
        ->toContain("handle @advanced_route_1 {\n            respond \"Not found\" 404\n        }")
        ->not->toContain("handle {\n            reverse_proxy http://backend:8080\n        }");
});

it('sanitizes advanced route caddy inputs before rendering', function () {
    ProxySite::create([
        'name' => 'Secure App',
        'domain' => 'secure.example.com',
        'backend_url' => 'http://fallback:80',
        'waf_enabled' => false,
        'protect_sensitive_files' => false,
        'advanced_routes' => [
            [
                'name' => 'Header Route',
                'priority' => 10,
                'matcher_type' => 'header',
                'matcher_value' => 'X-Mode: canary"blue',
                'upstream_url' => 'secure-app:443',
                'transport' => 'https',
                'header_up' => [
                    'X-Trace' => "alpha\"beta\nignored",
                    'Bad Header' => 'skip-me',
                ],
                'is_active' => true,
            ],
            [
                'name' => 'Invalid Header Route',
                'priority' => 20,
                'matcher_type' => 'header',
                'matcher_value' => ': invalid',
                'upstream_url' => 'invalid-header:80',
                'transport' => 'http',
                'is_active' => true,
            ],
            [
                'name' => 'Invalid Upstream',
                'priority' => 30,
                'matcher_type' => 'path',
                'matcher_value' => '/unsafe/*',
                'upstream_url' => "bad upstream\nhandle",
                'transport' => 'http',
                'is_active' => true,
            ],
        ],
    ]);

    $caddyfile = app(CaddyService::class)->renderCaddyfile(ProxySite::with('pageRules')->get(), collect());

    expect($caddyfile)
        ->toContain('@advanced_route_0')
        ->toContain('header X-Mode "canary\"blue"')
        ->toContain('reverse_proxy https://secure-app:443')
        ->toContain('header_up X-Trace "alpha\"betaignored"')
        ->not->toContain('Bad Header')
        ->not->toContain('invalid-header:80')
        ->not->toContain('bad upstream');
});

it('normalizes advanced route caddy inputs before persistence', function () {
    $controller = (new ReflectionClass(ProxySiteController::class))->newInstanceWithoutConstructor();
    $method = (new ReflectionClass($controller))->getMethod('normalizeAdvancedRoutes');
    $method->setAccessible(true);

    $routes = $method->invoke($controller, [
        [
            'name' => 'Valid Route',
            'priority' => 20,
            'matcher_type' => 'header',
            'matcher_value' => 'X-Canary: blue',
            'upstream_url' => ' app:443 ',
            'transport' => 'https',
            'header_up' => [
                'X-Trace' => "alpha\nbeta",
                'Bad Header' => 'drop',
            ],
        ],
        [
            'name' => 'Blank Upstream',
            'matcher_type' => 'path',
            'matcher_value' => '/blank',
            'upstream_url' => '   ',
        ],
    ]);

    expect($routes)->toHaveCount(1)
        ->and($routes[0]['upstream_url'])->toBe('app:443')
        ->and($routes[0]['matcher_value'])->toBe('X-Canary: blue')
        ->and($routes[0]['header_up'])->toBe([
            ['name' => 'X-Trace', 'value' => 'alphabeta', 'action' => 'set'],
        ]);
});
