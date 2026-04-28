<?php

namespace App\Models;

use App\Services\CaddyService;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProxySite extends Model
{
    use HasFactory;

    protected $fillable = [
        'team_id',
        'name',
        'domain',
        'backend_url',
        'backup_backend_url',
        'ssl_enabled',
        'waf_enabled',
        'rate_limit_rps',
        'rate_limit_burst',
        'rate_limit_action',
        'is_active',
        'total_requests',
        'blocked_requests',
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
        'is_online',
        'last_check_at',
        'last_error',
        'custom_error_403',
        'custom_error_503',
        'ip_allowlist',
        'ip_denylist',
        'geoip_allowlist',
        'geoip_denylist',
        'geoip_enabled',
        'custom_waf_rules',
        'env_vars',
        'header_rules',
        'redirect_rules',
        'block_common_bad_bots',
        'bot_challenge_mode',
        'bot_challenge_force',
        'under_attack_mode',
        'bot_fight_mode',
        'hsts_enabled',
        'performance_level',
        'route_policies',
        'circuit_breaker_enabled',
        'circuit_breaker_threshold',
        'circuit_breaker_retry_seconds',
        'circuit_breaker_opened_at',
        'hits_2xx',
        'hits_4xx',
        'hits_5xx',
        'avg_latency_ms',
        'bytes_in',
        'bytes_out',
        'uptime_percentage',
        'total_downtime_seconds',
        'monitoring_started_at',
    ];

    protected $casts = [
        'ip_allowlist' => 'array',
        'ip_denylist' => 'array',
        'geoip_allowlist' => 'array',
        'geoip_denylist' => 'array',
        'geoip_enabled' => 'boolean',
        'ssl_enabled' => 'boolean',
        'waf_enabled' => 'boolean',
        'is_active' => 'boolean',
        'is_maintenance' => 'boolean',
        'cache_enabled' => 'boolean',
        'block_common_bad_bots' => 'boolean',
        'bot_challenge_mode' => 'boolean',
        'bot_challenge_force' => 'boolean',
        'under_attack_mode' => 'boolean',
        'bot_fight_mode' => 'boolean',
        'hsts_enabled' => 'boolean',
        'route_policies' => 'array',
        'custom_waf_rules' => 'array',
        'env_vars' => 'array',
        'header_rules' => 'array',
        'redirect_rules' => 'array',
        'circuit_breaker_enabled' => 'boolean',
        'circuit_breaker_opened_at' => 'datetime',
        'monitoring_started_at' => 'datetime',
    ];

    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class);
    }

    public function securityEvents(): HasMany
    {
        return $this->hasMany(SecurityEvent::class);
    }

    public function pageRules(): HasMany
    {
        return $this->hasMany(PageRule::class)->orderBy('priority', 'desc');
    }

    public function configAudits(): HasMany
    {
        return $this->hasMany(ConfigAudit::class);
    }

    public function uptimeEvents(): HasMany
    {
        return $this->hasMany(UptimeEvent::class);
    }

    protected static function booted(): void
    {
        static::deleted(function ($site) {
            app(CaddyService::class)->sync();
        });
    }

    public function healthCheckLogs(): HasMany
    {
        return $this->hasMany(HealthCheckLog::class);
    }
}
