<?php

use App\Http\Controllers\AnalyticsController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\BannedIpController;
use App\Http\Controllers\LogExplorerController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\PolicyOptimizerController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ProxySiteController;
use App\Http\Controllers\SearchController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\SslController;
use App\Http\Controllers\TeamController;
use App\Http\Controllers\UptimeController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', fn () => Inertia::render('Welcome'));

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
    Route::post('/sites/{site}/page-rules', [ProxySiteController::class, 'storePageRule'])->name('sites.page-rules.store');
    Route::delete('/sites/{site}/page-rules/{rule}', [ProxySiteController::class, 'destroyPageRule'])->name('sites.page-rules.destroy');
    Route::post('/sites/{site}/apply-preset/{preset}', [ProxySiteController::class, 'applyWafPreset'])->name('sites.apply-preset');
    Route::post('/sites/{site}/apply-error-template', [ProxySiteController::class, 'applyErrorTemplate'])->name('sites.apply-error-template');
    Route::get('/sites/{site}/threat-map', [ProxySiteController::class, 'threatMap'])->name('sites.threat-map');

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

    Route::get('/search', SearchController::class)->name('search');

    // Policy Optimizer
    Route::get('/policy-optimizer/analyze', [PolicyOptimizerController::class, 'analyze'])->name('policy-optimizer.analyze');
    Route::post('/policy-optimizer/apply', [PolicyOptimizerController::class, 'apply'])->name('policy-optimizer.apply');

    // Notifications
    Route::get('/notifications', [NotificationController::class, 'index'])->name('notifications.index');
    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount'])->name('notifications.unread-count');
    Route::post('/notifications/{notification}/read', [NotificationController::class, 'markRead'])->name('notifications.read');
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllRead'])->name('notifications.read-all');

    // Settings
    Route::get('/settings', [SettingsController::class, 'index'])->name('settings.index');
    Route::post('/settings/smtp', [SettingsController::class, 'updateSmtp'])->name('settings.smtp');
    Route::post('/settings/smtp/test', [SettingsController::class, 'testSmtp'])->name('settings.smtp.test');
    Route::post('/settings/app', [SettingsController::class, 'updateApp'])->name('settings.app');
    Route::post('/settings/profile', [SettingsController::class, 'updateProfile'])->middleware('throttle:1,1')->name('settings.profile');
    Route::post('/settings/password', [SettingsController::class, 'updatePassword'])->middleware('throttle:1,1')->name('settings.password');
    Route::post('/settings/ssh-whitelist', [SettingsController::class, 'updateSshWhitelist'])->name('settings.ssh-whitelist');
});

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});
