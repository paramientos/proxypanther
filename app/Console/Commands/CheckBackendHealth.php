<?php

namespace App\Console\Commands;

use App\Services\HealthCheckService;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('health:check')]
#[Description('Run health checks for all active backend services')]
class CheckBackendHealth extends Command
{
    /**
     * Execute the console command.
     */
    public function handle(HealthCheckService $healthCheckService)
    {
        $this->info('Starting health checks...');
        $healthCheckService->checkAll();
        $this->info('Health checks completed.');
    }
}
