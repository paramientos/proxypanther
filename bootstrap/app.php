<?php

use App\Http\Middleware\HandleInertiaRequests;
use App\Services\LogParserService;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Exceptions\ThrottleRequestsException;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;

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
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);
    })
    ->withSchedule(function (Schedule $schedule): void {
        // Health checks every minute
        $schedule->command('health:check')->everyMinute();

        // Parse Caddy logs every minute for real-time stats
        $schedule->call(function () {
            app(LogParserService::class)->parseAll();
        })->everyMinute()->name('parse-caddy-logs')->withoutOverlapping();

        // Sync Caddy config every 5 minutes (catch any drift)
        $schedule->command('caddy:sync')->everyFiveMinutes()->withoutOverlapping();
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->render(function (ThrottleRequestsException $e, $request) {
            if ($request->inertia()) {
                return back()->withErrors(['rate_limit' => 'Too many attempts. Please wait a minute before trying again.']);
            }
        });
    })->create();
