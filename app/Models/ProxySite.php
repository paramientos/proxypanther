<?php

namespace App\Models;

use App\Models\SecurityEvent;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProxySite extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'domain',
        'backend_url',
        'backup_backend_url',
        'ssl_enabled',
        'waf_enabled',
        'rate_limit_rps',
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
        'custom_waf_rules',
        'env_vars',
        'block_common_bad_bots',
        'hits_2xx',
        'hits_4xx',
        'hits_5xx',
        'avg_latency_ms',
    ];

    protected $casts = [
        'ip_allowlist' => 'array',
        'ip_denylist' => 'array',
        'ssl_enabled' => 'boolean',
        'waf_enabled' => 'boolean',
        'is_active' => 'boolean',
        'is_maintenance' => 'boolean',
        'cache_enabled' => 'boolean',
        'block_common_bad_bots' => 'boolean',
        'custom_waf_rules' => 'array',
        'env_vars' => 'array',
    ];

    public function securityEvents(): HasMany
    {
        return $this->hasMany(SecurityEvent::class);
    }
}
