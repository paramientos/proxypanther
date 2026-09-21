<?php

use App\Models\ProxySite;
use App\Models\User;
use App\Services\CaddyService;
use Inertia\Testing\AssertableInertia as Assert;

test('dashboard displays proxy sites', function () {
    $user = User::factory()->create();

    ProxySite::create([
        'name' => 'Test Site',
        'domain' => 'test.example.com',
        'backend_url' => 'http://127.0.0.1:8080',
    ]);

    $response = $this->actingAs($user)->get('/dashboard');

    $response
        ->assertStatus(200)
        ->assertInertia(fn (Assert $page) => $page
            ->component('EnterpriseDashboard')
            ->has('sites', 1)
            ->where('sites.0.name', 'Test Site')
            ->where('sites.0.domain', 'test.example.com'));
});

test('can create a proxy site', function () {
    $user = User::factory()->create();

    $this->mock(CaddyService::class, function ($mock) {
        $mock->shouldReceive('sync')->once()->andReturnTrue();
    });

    $response = $this->actingAs($user)->post('/sites', [
        'name' => 'New Site',
        'domain' => 'new.example.com',
        'backend_url' => 'http://127.0.0.1:9000',
        'backend_type' => 'proxy',
    ]);

    $this->assertDatabaseHas('proxy_sites', [
        'name' => 'New Site',
        'domain' => 'new.example.com',
        'backend_url' => 'http://127.0.0.1:9000',
    ]);

    $response->assertRedirect(route('dashboard', absolute: false));
});
