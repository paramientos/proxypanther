<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\Deployment;

class Project extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'path',
        'docker_compose_file',
        'webhook_token',
        'last_deployed_at',
    ];

    public function deployments()
    {
        return $this->hasMany(Deployment::class);
    }
}
