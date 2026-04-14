<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DailyMetric extends Model
{
    protected $fillable = [
        'proxy_site_id',
        'date',
        'total_requests',
        'blocked_requests',
        'hits_2xx',
        'hits_4xx',
        'hits_5xx',
        'bytes_in',
        'bytes_out',
    ];

    protected $casts = [
        'date' => 'date',
    ];

    public function proxySite(): BelongsTo
    {
        return $this->belongsTo(ProxySite::class);
    }
}
