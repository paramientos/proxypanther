<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Health checks every minute
Schedule::command('health:check')->everyMinute();

// Parse Caddy logs every minute for real-time stats
Schedule::call(function () {
    app(\App\Services\LogParserService::class)->parseAll();
})->everyMinute()->name('parse-caddy-logs')->withoutOverlapping();

// Sync Caddy config every 5 minutes (catch any drift)
Schedule::command('caddy:sync')->everyFiveMinutes()->withoutOverlapping();
