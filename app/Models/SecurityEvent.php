<?php

namespace App\Models;

use App\Models\ProxySite;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SecurityEvent extends Model
{
    use HasFactory;

    protected $fillable = [
        'proxy_site_id',
        'type',
        'ip_address',
        'user_agent',
        'request_method',
        'request_path',
        'payload',
    ];

    public function proxySite(): BelongsTo
    {
        return $this->belongsTo(ProxySite::class);
    }
}
