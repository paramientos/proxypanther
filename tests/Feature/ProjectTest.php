<?php

use App\Models\User;
use App\Models\Project;
use Illuminate\Support\Str;

test('dashboard displays projects', function () {
    $user = User::factory()->create();
    $project = Project::create([
        'name' => 'Test Project',
        'path' => '/tmp',
        'webhook_token' => Str::random(32),
    ]);

    $response = $this->actingAs($user)->get('/dashboard');

    $response->assertStatus(200);
    $response->assertSee('Test Project');
});

test('can create a project', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->post('/projects', [
        'name' => 'New Project',
        'path' => '/var/www/new',
        'docker_compose_file' => 'docker-compose.yml',
    ]);

    $this->assertDatabaseHas('projects', ['name' => 'New Project']);
    $response->assertRedirect();
});
