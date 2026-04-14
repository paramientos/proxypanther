<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UptimeEvent extends Model
{
    protected $fillable = ['proxy_site_id', 'type', 'reason', 'duration_seconds'];

    public function proxySite(): BelongsTo
    {
        return $this->belongsTo(ProxySite::class);
    }
}
