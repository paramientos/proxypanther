<?php

namespace App\Jobs;

use App\Models\Deployment;
use App\Services\DeploymentService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class DeployProjectJob implements ShouldQueue
{
    use InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public Deployment $deployment)
    {
    }

    public function handle(DeploymentService $deploymentService)
    {
        $deploymentService->execute($this->deployment);
    }
}
