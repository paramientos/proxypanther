<?php

use App\Models\ProxySite;
use App\Services\CaddyService;

test('webhook activates failover for a matching proxy site token', function () {
    $this->mock(CaddyService::class, function ($mock) {
        $mock->shouldReceive('sync')->once()->andReturnTrue();
    });

    $site = ProxySite::create([
        'name' => 'Webhook Site',
        'domain' => 'webhook.example.com',
        'backend_url' => 'http://127.0.0.1:8080',
        'notification_webhook_url' => 'https://ping.example/hooks/secret-token',
        'is_maintenance' => false,
    ]);

    $response = $this->postJson('/api/webhook/secret-token', [
        'action' => 'failover',
    ]);

    $response->assertStatus(200);
    $response->assertJsonPath('status', 'failover activated');

    expect($site->refresh()->is_maintenance)->toBeTrue();
});

test('webhook fails with invalid token', function () {
    $response = $this->postJson('/api/webhook/invalid-token');
    $response->assertStatus(404);
});
