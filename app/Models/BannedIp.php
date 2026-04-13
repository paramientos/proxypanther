<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class BannedIp extends Model
{
    use HasFactory;

    protected $fillable = [
        'ip_address',
        'reason',
    ];
}
