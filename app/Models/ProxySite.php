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
    ];

    public function securityEvents(): HasMany
    {
        return $this->hasMany(SecurityEvent::class);
    }
}
