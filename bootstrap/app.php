<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        channels: __DIR__.'/../routes/channels.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->web(append: [
            \App\Http\Middleware\HandleInertiaRequests::class,
            \Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets::class,
        ]);
    })
    ->withSchedule(function (\Illuminate\Console\Scheduling\Schedule $schedule): void {
        // Health checks every minute
        $schedule->command('health:check')->everyMinute();

        // Parse Caddy logs every minute for real-time stats
        $schedule->call(function () {
            app(\App\Services\LogParserService::class)->parseAll();
        })->everyMinute()->name('parse-caddy-logs')->withoutOverlapping();

        // Sync Caddy config every 5 minutes (catch any drift)
        $schedule->command('caddy:sync')->everyFiveMinutes()->withoutOverlapping();
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
