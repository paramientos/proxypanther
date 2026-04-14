<?php

namespace App\Http\Controllers;

use App\Models\ConfigAudit;
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
            'site' => $site->load([
                'securityEvents',
                'configAudits' => fn ($query) => $query->with('user')->latest()->limit(20),
            ]),
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
            'backup_backend_url' => 'nullable|string|max:255',
            'custom_waf_rules' => 'nullable|array',
            'env_vars' => 'nullable|array',
            'bot_challenge_mode' => 'boolean',
            'bot_challenge_force' => 'boolean',
            'route_policies' => 'nullable|array',
            'circuit_breaker_enabled' => 'boolean',
            'circuit_breaker_threshold' => 'integer|min:1|max:20',
            'circuit_breaker_retry_seconds' => 'integer|min:5|max:600',
            'custom_error_403' => 'nullable|string',
            'custom_error_503' => 'nullable|string',
            'ip_allowlist' => 'nullable|string', // UI handles as comma/newline separated
            'ip_denylist' => 'nullable|string',
            'block_common_bad_bots' => 'boolean',
        ]);

        if (isset($validated['ip_allowlist'])) {
            $validated['ip_allowlist'] = preg_split('/[,\s]+/', $validated['ip_allowlist'], -1, PREG_SPLIT_NO_EMPTY);
        }
        if (isset($validated['ip_denylist'])) {
            $validated['ip_denylist'] = preg_split('/[,\s]+/', $validated['ip_denylist'], -1, PREG_SPLIT_NO_EMPTY);
        }

        if (isset($validated['route_policies'])) {
            $validated['route_policies'] = $this->normalizeRoutePolicies($validated['route_policies']);
        }

        $site = ProxySite::create($validated);

        ConfigAudit::create([
            'proxy_site_id' => $site->id,
            'user_id' => auth()->id(),
            'action' => 'create',
            'after_state' => $this->trackedState($site),
        ]);

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
            'backup_backend_url' => 'nullable|string|max:255',
            'custom_waf_rules' => 'nullable|array',
            'env_vars' => 'nullable|array',
            'bot_challenge_mode' => 'boolean',
            'bot_challenge_force' => 'boolean',
            'route_policies' => 'nullable|array',
            'circuit_breaker_enabled' => 'boolean',
            'circuit_breaker_threshold' => 'integer|min:1|max:20',
            'circuit_breaker_retry_seconds' => 'integer|min:5|max:600',
            'custom_error_403' => 'nullable|string',
            'custom_error_503' => 'nullable|string',
            'ip_allowlist' => 'nullable|string',
            'ip_denylist' => 'nullable|string',
            'block_common_bad_bots' => 'boolean',
        ]);

        if (isset($validated['ip_allowlist'])) {
            $validated['ip_allowlist'] = preg_split('/[,\s]+/', $validated['ip_allowlist'], -1, PREG_SPLIT_NO_EMPTY);
        }
        if (isset($validated['ip_denylist'])) {
            $validated['ip_denylist'] = preg_split('/[,\s]+/', $validated['ip_denylist'], -1, PREG_SPLIT_NO_EMPTY);
        }

        if (isset($validated['route_policies'])) {
            $validated['route_policies'] = $this->normalizeRoutePolicies($validated['route_policies']);
        }

        $beforeState = $this->trackedState($site);

        $site->update($validated);

        ConfigAudit::create([
            'proxy_site_id' => $site->id,
            'user_id' => auth()->id(),
            'action' => 'update',
            'before_state' => $beforeState,
            'after_state' => $this->trackedState($site->fresh()),
        ]);

        $this->caddy->sync();

        return redirect()->back();
    }

    public function toggle(ProxySite $site)
    {
        $beforeState = $this->trackedState($site);
        $site->update(['is_active' => !$site->is_active]);

        ConfigAudit::create([
            'proxy_site_id' => $site->id,
            'user_id' => auth()->id(),
            'action' => 'toggle',
            'before_state' => $beforeState,
            'after_state' => $this->trackedState($site->fresh()),
        ]);

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

    public function rollback(ProxySite $site, ConfigAudit $audit)
    {
        abort_if($audit->proxy_site_id !== $site->id, 404);

        $targetState = $audit->before_state ?: $audit->after_state;

        if (!$targetState) {
            return redirect()->back()->with('error', 'Rollback state not available.');
        }

        $beforeState = $this->trackedState($site);
        $restorable = array_intersect_key($targetState, array_flip($this->trackedKeys()));

        $site->update($restorable);

        ConfigAudit::create([
            'proxy_site_id' => $site->id,
            'user_id' => auth()->id(),
            'action' => 'rollback',
            'before_state' => $beforeState,
            'after_state' => $this->trackedState($site->fresh()),
            'rollback_of_audit_id' => $audit->id,
        ]);

        $this->caddy->sync();

        return redirect()->back()->with('success', 'Configuration rolled back successfully.');
    }

    private function trackedKeys(): array
    {
        return [
            'name',
            'domain',
            'backend_url',
            'backup_backend_url',
            'ssl_enabled',
            'waf_enabled',
            'rate_limit_rps',
            'auth_user',
            'auth_password',
            'protect_sensitive_files',
            'notification_webhook_url',
            'backend_type',
            'root_path',
            'cache_enabled',
            'cache_ttl',
            'is_maintenance',
            'maintenance_message',
            'custom_error_403',
            'custom_error_503',
            'ip_allowlist',
            'ip_denylist',
            'custom_waf_rules',
            'env_vars',
            'block_common_bad_bots',
            'bot_challenge_mode',
            'bot_challenge_force',
            'route_policies',
            'circuit_breaker_enabled',
            'circuit_breaker_threshold',
            'circuit_breaker_retry_seconds',
        ];
    }

    private function trackedState(ProxySite $site): array
    {
        return $site->only($this->trackedKeys());
    }

    private function normalizeRoutePolicies(array $policies): array
    {
        return collect($policies)
            ->filter(fn ($policy) => is_array($policy) && !empty($policy['path']))
            ->map(fn ($policy) => [
                'path' => (string) $policy['path'],
                'waf_enabled' => (bool) ($policy['waf_enabled'] ?? true),
                'bot_challenge_mode' => (bool) ($policy['bot_challenge_mode'] ?? false),
                'rate_limit_rps' => (int) ($policy['rate_limit_rps'] ?? 0),
            ])
            ->values()
            ->all();
    }
}
