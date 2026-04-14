<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PageRule extends Model
{
    protected $fillable = [
        'proxy_site_id',
        'path',
        'type',
        'value',
        'priority',
        'is_active'
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'priority' => 'integer'
    ];

    public function proxySite(): BelongsTo
    {
        return $this->belongsTo(ProxySite::class);
    }
}
