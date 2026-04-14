<?php

namespace App\Http\Controllers;

use App\Models\BannedIp;
use App\Models\ConfigAudit;
use App\Models\DailyMetric;
use App\Models\ProxySite;
use App\Models\SecurityEvent;
use App\Services\CaddyService;
use App\Services\ErrorPageService;
use App\Services\HealthCheckService;
use App\Services\LogParserService;
use App\Services\WafPresetService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProxySiteController extends Controller
{
    public function __construct(
        protected CaddyService $caddy,
        protected LogParserService $logParser,
        protected HealthCheckService $healthCheck,
        protected WafPresetService $presetService,
        protected ErrorPageService $errorPageService
    ) {}

    public function index()
    {
        $this->logParser->parseAll();

        $analytics = DailyMetric::selectRaw('date, sum(total_requests) as total, sum(blocked_requests) as blocked')
            ->where('date', '>=', now()->subDays(30))
            ->groupBy('date')
            ->orderBy('date')
            ->get();
        $recentEvents = SecurityEvent::with('proxySite')->latest()->limit(10)->get();
        
        $threatsByCountry = SecurityEvent::selectRaw('country_code, COUNT(*) as count')
            ->whereNotNull('country_code')
            ->groupBy('country_code')
            ->orderByDesc('count')
            ->get();

        return Inertia::render('EnterpriseDashboard', [
            'sites' => ProxySite::withCount('securityEvents')->get(),
            'bannedIps' => BannedIp::all(),
            'analytics' => $analytics,
            'recentEvents' => $recentEvents,
            'threatsByCountry' => $threatsByCountry,
        ]);
    }

    public function show(ProxySite $site)
    {
        $site->load(['pageRules', 'configAudits.user']);
        $this->logParser->parseForSite($site);

        $analytics = DailyMetric::where('proxy_site_id', $site->id)
            ->where('date', '>=', now()->subDays(30))
            ->orderBy('date')
            ->get();

        // Bandwidth per day (last 7 days) - from security events as proxy
        $bandwidth = SecurityEvent::selectRaw('DATE(created_at) as date, count(*) as requests')
            ->where('proxy_site_id', $site->id)
            ->where('created_at', '>=', now()->subDays(30))
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        return Inertia::render('Sites/Show', [
            'site' => $site->load([
                'securityEvents' => fn ($q) => $q->latest()->limit(50),
                'configAudits' => fn ($q) => $q->with('user')->latest()->limit(20),
                'uptimeEvents' => fn ($q) => $q->latest()->limit(30),
            ]),
            'analytics' => $analytics,
            'bandwidth' => $bandwidth,
            'wafPresets' => $this->presetService->getPresets(),
            'errorTemplates' => $this->errorPageService->getTemplates(),
            'healthLogs' => $site->healthCheckLogs()->latest()->limit(48)->get(),
            'sslCertificates' => $this->caddy->getSslCertificates(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate($this->validationRules());
        $validated = $this->normalizeInputs($validated);

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
        $validated = $request->validate($this->validationRules($site->id));
        $validated = $this->normalizeInputs($validated);

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
        $site->update(['is_active' => ! $site->is_active]);

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

    public function applyWafPreset(ProxySite $site, string $preset)
    {
        $presets = $this->presetService->getPresets();
        if (! isset($presets[$preset])) {
            return back()->with('error', 'Invalid preset.');
        }

        $newRules = $presets[$preset]['rules'];
        $existingRules = $site->custom_waf_rules ?: [];

        // Merge without duplicates (based on pattern)
        $patterns = array_column($existingRules, 'pattern');
        foreach ($newRules as $rule) {
            if (! in_array($rule['pattern'], $patterns)) {
                $existingRules[] = $rule;
            }
        }

        $site->update(['custom_waf_rules' => $existingRules]);
        $this->caddy->sync();

        return back()->with('success', "{$presets[$preset]['name']} applied successfully.");
    }

    public function applyErrorTemplate(ProxySite $site, Request $request)
    {
        $request->validate([
            'template' => 'required|string',
            'code' => 'required|in:403,503',
        ]);

        $templates = $this->errorPageService->getTemplates();
        if (! isset($templates[$request->template])) {
            return back()->with('error', 'Invalid template.');
        }

        $html = $templates[$request->template]['html'];
        $field = "custom_error_{$request->code}";

        $site->update([$field => $html]);
        $this->caddy->sync();

        return back()->with('success', "Template applied to {$request->code} successfully.");
    }

    public function threatMap(ProxySite $site)
    {
        $threats = SecurityEvent::where('proxy_site_id', $site->id)
            ->selectRaw('country_code, country_name, COUNT(*) as count')
            ->whereNotNull('country_code')
            ->groupBy('country_code', 'country_name')
            ->get();

        return response()->json($threats);
    }

    public function destroy(ProxySite $site)
    {
        $site->delete();
        $this->caddy->sync();

        return redirect()->route('dashboard');
    }

    public function storePageRule(Request $request, ProxySite $site)
    {
        $request->validate([
            'path' => 'required|string',
            'type' => 'required|in:redirect,rewrite,header',
            'value' => 'required|string',
        ]);

        $site->pageRules()->create($request->all());

        $this->caddy->sync();

        return back()->with('success', 'Page rule created successfully.');
    }

    public function destroyPageRule(ProxySite $site, PageRule $rule)
    {
        $rule->delete();
        $this->caddy->sync();

        return back()->with('success', 'Page rule deleted successfully.');
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

        if (! $targetState) {
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

    // -------------------------------------------------------------------------

    private function validationRules(?int $siteId = null): array
    {
        $uniqueDomain = $siteId
            ? "required|string|unique:proxy_sites,domain,{$siteId}"
            : 'required|string|unique:proxy_sites,domain';

        return [
            'name' => 'required|string|max:255',
            'domain' => $uniqueDomain,
            'backend_url' => 'required|string',
            'ssl_enabled' => 'boolean',
            'waf_enabled' => 'boolean',
            'rate_limit_rps' => 'integer|min:1|max:10000',
            'rate_limit_burst' => 'integer|min:0|max:10000',
            'rate_limit_action' => 'required|string|in:block,delay',
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
            'header_rules' => 'nullable|array',
            'redirect_rules' => 'nullable|array',
            'route_policies' => 'nullable|array',
            'circuit_breaker_enabled' => 'boolean',
            'circuit_breaker_threshold' => 'integer|min:1|max:20',
            'circuit_breaker_retry_seconds' => 'integer|min:5|max:600',
            'custom_error_403' => 'nullable|string',
            'custom_error_503' => 'nullable|string',
            'ip_allowlist' => 'nullable|string',
            'ip_denylist' => 'nullable|string',
            'geoip_allowlist' => 'nullable|string',
            'geoip_denylist' => 'nullable|string',
            'geoip_enabled' => 'boolean',
            'block_common_bad_bots' => 'boolean',
            'bot_challenge_mode' => 'boolean',
            'bot_challenge_force' => 'boolean',
            'under_attack_mode' => 'boolean',
            'bot_fight_mode' => 'boolean',
            'brotli_enabled' => 'boolean',
            'hsts_enabled' => 'boolean',
            'performance_level' => 'required|string|in:balanced,aggressive,off',
        ];
    }

    private function normalizeInputs(array $validated): array
    {
        foreach (['ip_allowlist', 'ip_denylist', 'geoip_allowlist', 'geoip_denylist'] as $field) {
            if (isset($validated[$field]) && is_string($validated[$field])) {
                $validated[$field] = preg_split('/[,\s]+/', $validated[$field], -1, PREG_SPLIT_NO_EMPTY);
            }
        }

        if (isset($validated['route_policies'])) {
            $validated['route_policies'] = $this->normalizeRoutePolicies($validated['route_policies']);
        }

        return $validated;
    }

    private function trackedKeys(): array
    {
        return [
            'name', 'domain', 'backend_url', 'backup_backend_url',
            'ssl_enabled', 'waf_enabled', 'rate_limit_rps',
            'auth_user', 'auth_password', 'protect_sensitive_files',
            'notification_webhook_url', 'backend_type', 'root_path',
            'cache_enabled', 'cache_ttl', 'is_maintenance', 'maintenance_message',
            'custom_error_403', 'custom_error_503',
            'ip_allowlist', 'ip_denylist', 'geoip_allowlist', 'geoip_denylist', 'geoip_enabled',
            'custom_waf_rules', 'env_vars', 'header_rules', 'redirect_rules',
            'block_common_bad_bots', 'bot_challenge_mode', 'bot_challenge_force',
            'route_policies', 'circuit_breaker_enabled',
            'circuit_breaker_threshold', 'circuit_breaker_retry_seconds',
        ];
    }

    private function trackedState(ProxySite $site): array
    {
        return $site->only($this->trackedKeys());
    }

    private function normalizeRoutePolicies(array $policies): array
    {
        return collect($policies)
            ->filter(fn ($p) => \is_array($p) && ! empty($p['path']))
            ->map(fn ($p) => [
                'path' => (string) $p['path'],
                'waf_enabled' => (bool) ($p['waf_enabled'] ?? true),
                'bot_challenge_mode' => (bool) ($p['bot_challenge_mode'] ?? false),
                'rate_limit_rps' => (int) ($p['rate_limit_rps'] ?? 0),
            ])
            ->values()
            ->all();
    }
}
