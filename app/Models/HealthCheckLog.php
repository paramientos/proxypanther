<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HealthCheckLog extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'proxy_site_id',
        'status',
        'response_code',
        'latency',
        'error_message',
        'created_at'
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'latency'    => 'float',
    ];

    public function proxySite(): BelongsTo
    {
        return $this->belongsTo(ProxySite::class);
    }
}
