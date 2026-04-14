<?php

use App\Http\Controllers\AnalyticsController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\BannedIpController;
use App\Http\Controllers\LogExplorerController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ProxySiteController;
use App\Http\Controllers\SslController;
use App\Http\Controllers\TeamController;
use App\Http\Controllers\UptimeController;
use App\Models\ProxySite;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', fn () => Inertia::render('Welcome'));

Route::get('/debug-caddy', function () {
    return ProxySite::all()->map(fn ($site) => [
        'id' => $site->id,
        'name' => $site->name,
        'geoip' => $site->geoip_enabled,
        'deny' => $site->geoip_denylist,
        'domain' => $site->domain,
    ]);
});

Route::middleware('guest')->group(function () {
    Route::get('login', [AuthController::class, 'showLogin'])->name('login');
    Route::post('login', [AuthController::class, 'login']);
});

Route::middleware(['auth', 'verified'])->group(function () {
    // Dashboard & Sites
    Route::get('/dashboard', [ProxySiteController::class, 'index'])->name('dashboard');
    Route::get('/sites/{site}', [ProxySiteController::class, 'show'])->name('sites.show');
    Route::post('/sites', [ProxySiteController::class, 'store'])->name('sites.store');
    Route::post('/sites/{site}', [ProxySiteController::class, 'update'])->name('sites.update');
    Route::post('/sites/{site}/toggle', [ProxySiteController::class, 'toggle'])->name('sites.toggle');
    Route::post('/sites/{site}/check-health', [ProxySiteController::class, 'checkHealth'])->name('sites.check-health');
    Route::post('/sites/{site}/audits/{audit}/rollback', [ProxySiteController::class, 'rollback'])->name('sites.audits.rollback');
    Route::delete('/sites/{site}', [ProxySiteController::class, 'destroy'])->name('sites.destroy');

    // Banned IPs
    Route::get('/banned-ips', [BannedIpController::class, 'index'])->name('banned-ips.index');
    Route::post('/banned-ips', [BannedIpController::class, 'store'])->name('banned-ips.store');
    Route::delete('/banned-ips/{bannedIp}', [BannedIpController::class, 'destroy'])->name('banned-ips.destroy');

    // Logs & Analytics
    Route::get('/logs', [LogExplorerController::class, 'index'])->name('logs.index');
    Route::get('/logs/export', [LogExplorerController::class, 'export'])->name('logs.export');
    Route::get('/analytics', [AnalyticsController::class, 'index'])->name('analytics.index');

    // SSL Panel
    Route::get('/ssl', [SslController::class, 'index'])->name('ssl.index');

    // Uptime / SLA
    Route::get('/uptime', [UptimeController::class, 'index'])->name('uptime.index');

    // Teams
    Route::get('/teams', [TeamController::class, 'index'])->name('teams.index');
    Route::post('/teams', [TeamController::class, 'store'])->name('teams.store');
    Route::post('/teams/{team}/invite', [TeamController::class, 'invite'])->name('teams.invite');
    Route::delete('/teams/{team}/members/{user}', [TeamController::class, 'removeMember'])->name('teams.members.remove');
    Route::post('/teams/switch', [TeamController::class, 'switchTeam'])->name('teams.switch');
    Route::delete('/teams/{team}', [TeamController::class, 'destroy'])->name('teams.destroy');

    Route::post('logout', [AuthController::class, 'logout'])->name('logout');
});

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});
