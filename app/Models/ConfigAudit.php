<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ConfigAudit extends Model
{
    use HasFactory;

    protected $fillable = [
        'proxy_site_id',
        'user_id',
        'action',
        'before_state',
        'after_state',
        'rollback_of_audit_id',
    ];

    protected $casts = [
        'before_state' => 'array',
        'after_state' => 'array',
    ];

    public function proxySite(): BelongsTo
    {
        return $this->belongsTo(ProxySite::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function rollbackOf(): BelongsTo
    {
        return $this->belongsTo(self::class, 'rollback_of_audit_id');
    }

    public function rollbacks(): HasMany
    {
        return $this->hasMany(self::class, 'rollback_of_audit_id');
    }
}
