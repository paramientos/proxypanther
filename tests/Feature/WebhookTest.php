<?php

use App\Models\Project;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Queue;
use App\Jobs\DeployProjectJob;

test('webhook triggers deployment', function () {
    Queue::fake();

    $project = Project::create([
        'name' => 'Webhook Project',
        'path' => '/tmp',
        'webhook_token' => 'secret-token',
    ]);

    $response = $this->postJson("/api/webhook/secret-token", [
        'push_data' => ['tag' => 'v1.0.0']
    ]);

    $response->assertStatus(200);
    $response->assertJsonPath('message', 'Deployment triggered');

    $this->assertDatabaseHas('deployments', [
        'project_id' => $project->id,
        'version' => 'v1.0.0',
        'status' => 'pending'
    ]);

    Queue::assertPushed(DeployProjectJob::class);
});

test('webhook fails with invalid token', function () {
    $response = $this->postJson("/api/webhook/invalid-token");
    $response->assertStatus(404);
});
