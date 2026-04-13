<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\Project;

class Deployment extends Model
{
    /** @use HasFactory<\Database\Factories\DeploymentFactory> */
    use HasFactory;

    protected $fillable = [
        'project_id',
        'status',
        'version',
        'logs',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }
}
