<?php

namespace App\Http\Controllers;

use App\Models\ProxySite;
use App\Models\BannedIp;
use App\Models\SecurityEvent;
use App\Services\CaddyService;
use App\Services\LogParserService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProxySiteController extends Controller
{
    public function __construct(
        protected CaddyService $caddy,
        protected LogParserService $logParser,
        protected \App\Services\HealthCheckService $healthCheck
    ) {
    }

    public function index()
    {
        $this->logParser->parseAll();
        // Optional: Trigger health check on index load if it's been a while
        // But better to keep it async or via schedule to not slow down UI
        
        $analytics = SecurityEvent::selectRaw('DATE(created_at) as date, count(*) as count')
            ->where('created_at', '>=', now()->subDays(7))
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        $recentEvents = SecurityEvent::with('proxySite')
            ->latest()
            ->limit(10)
            ->get();

        return Inertia::render('Dashboard', [
            'sites' => ProxySite::withCount('securityEvents')->get(),
            'bannedIps' => BannedIp::all(),
            'analytics' => $analytics,
            'recentEvents' => $recentEvents,
        ]);
    }

    public function show(ProxySite $site)
    {
        $this->logParser->parseForSite($site);

        $analytics = SecurityEvent::selectRaw('DATE(created_at) as date, count(*) as count')
            ->where('proxy_site_id', $site->id)
            ->where('created_at', '>=', now()->subDays(7))
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        return Inertia::render('Sites/Show', [
            'site' => $site->load('securityEvents'),
            'analytics' => $analytics,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'domain' => 'required|string|unique:proxy_sites,domain',
            'backend_url' => 'required|string', // Support multiple URLs
            'ssl_enabled' => 'boolean',
            'waf_enabled' => 'boolean',
            'rate_limit_rps' => 'integer|min:1|max:1000',
            'auth_user' => 'nullable|string|max:255',
            'auth_password' => 'nullable|string|max:255',
            'protect_sensitive_files' => 'boolean',
            'notification_webhook_url' => 'nullable|url',
            'backend_type' => 'required|string|in:proxy,php_fpm',
            'root_path' => 'required_if:backend_type,php_fpm|nullable|string|max:255',
            'cache_enabled' => 'boolean',
            'cache_ttl' => 'integer|min:0',
            'is_maintenance' => 'boolean',
            'maintenance_message' => 'nullable|string|max:1000',
        ]);

        ProxySite::create($validated);
        $this->caddy->sync();

        return redirect()->back()->with('success', 'Proxy site added successfully.');
    }

    public function update(Request $request, ProxySite $site)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'domain' => 'required|string|unique:proxy_sites,domain,' . $site->id,
            'backend_url' => 'required|string', // Support multiple URLs
            'ssl_enabled' => 'boolean',
            'waf_enabled' => 'boolean',
            'rate_limit_rps' => 'integer|min:1|max:1000',
            'auth_user' => 'nullable|string|max:255',
            'auth_password' => 'nullable|string|max:255',
            'protect_sensitive_files' => 'boolean',
            'notification_webhook_url' => 'nullable|url',
            'backend_type' => 'required|string|in:proxy,php_fpm',
            'root_path' => 'required_if:backend_type,php_fpm|nullable|string|max:255',
            'cache_enabled' => 'boolean',
            'cache_ttl' => 'integer|min:0',
            'is_maintenance' => 'boolean',
            'maintenance_message' => 'nullable|string|max:1000',
        ]);

        $site->update($validated);
        $this->caddy->sync();

        return redirect()->back();
    }

    public function toggle(ProxySite $site)
    {
        $site->update(['is_active' => !$site->is_active]);
        $this->caddy->sync();
        
        return redirect()->back();
    }

    public function destroy(ProxySite $site)
    {
        $site->delete();
        $this->caddy->sync();

        return redirect()->route('dashboard');
    }

    public function banIp(Request $request)
    {
        $validated = $request->validate([
            'ip_address' => 'required|ip|unique:banned_ips,ip_address',
            'reason' => 'nullable|string|max:255',
        ]);

        BannedIp::create($validated);
        $this->caddy->sync();

        return redirect()->back();
    }

    public function unbanIp(BannedIp $bannedIp)
    {
        $bannedIp->delete();
        $this->caddy->sync();

        return redirect()->back();
    }

    public function checkHealth(ProxySite $site)
    {
        $this->healthCheck->checkSite($site);
        return redirect()->back()->with('success', 'Health check performed.');
    }
}
