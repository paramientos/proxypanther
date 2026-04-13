<?php

namespace App\Services;

use App\Models\Deployment;
use App\Models\Project;
use Symfony\Component\Process\Process;
use Illuminate\Support\Facades\Log;

class DeploymentService
{
    public function execute(Deployment $deployment)
    {
        $project = $deployment->project;
        $deployment->update(['status' => 'running', 'logs' => "Starting deployment for project: {$project->name}\n"]);

        $commands = [
            ['docker', 'compose', '-f', $project->docker_compose_file, 'pull'],
            ['docker', 'compose', '-f', $project->docker_compose_file, 'up', '-d'],
        ];

        $allLogs = $deployment->logs;

        foreach ($commands as $command) {
            $process = new Process($command, $project->path);
            $process->setTimeout(600); // 10 minutes

            $process->run(function ($type, $buffer) use (&$allLogs, $deployment) {
                $allLogs .= $buffer;
                $deployment->update(['logs' => $allLogs]);
            });

            if (!$process->isSuccessful()) {
                $allLogs .= "\nCommand failed: " . implode(' ', $command) . "\n";
                $deployment->update(['status' => 'failed', 'logs' => $allLogs]);
                return false;
            }
        }

        $allLogs .= "\nDeployment successful!\n";
        $deployment->update(['status' => 'success', 'logs' => $allLogs]);
        $project->update(['last_deployed_at' => now()]);

        return true;
    }

    public function rollback(Project $project)
    {
        // For simple docker-compose, rollback can be tricky if we don't have previous versions tracked.
        // We'll assume we can use `docker-compose up -d` with previous version if we store the tag.
        // For now, let's just implement a simple "restart" or a dummy rollback.
        // In a real scenario, we'd need to store the previous image tag.
    }
}
