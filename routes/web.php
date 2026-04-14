<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ProxySiteController;
use App\Http\Controllers\BannedIpController;
use App\Http\Controllers\LogExplorerController;
use App\Http\Controllers\AuthController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome');
});

Route::middleware('guest')->group(function () {
    Route::get('login', [AuthController::class, 'showLogin'])->name('login');
    Route::post('login', [AuthController::class, 'login']);
    Route::get('register', [AuthController::class, 'showRegister'])->name('register');
    Route::post('register', [AuthController::class, 'register']);
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', [ProxySiteController::class, 'index'])->name('dashboard');
    Route::get('/sites/{site}', [ProxySiteController::class, 'show'])->name('sites.show');
    Route::post('/sites', [ProxySiteController::class, 'store'])->name('sites.store');
    Route::post('/sites/{site}', [ProxySiteController::class, 'update'])->name('sites.update');
    Route::post('/sites/{site}/toggle', [ProxySiteController::class, 'toggle'])->name('sites.toggle');
    Route::post('/sites/{site}/check-health', [ProxySiteController::class, 'checkHealth'])->name('sites.check-health');
    Route::post('/sites/{site}/audits/{audit}/rollback', [ProxySiteController::class, 'rollback'])->name('sites.audits.rollback');
    Route::delete('/sites/{site}', [ProxySiteController::class, 'destroy'])->name('sites.destroy');
    
    Route::get('/banned-ips', [BannedIpController::class, 'index'])->name('banned-ips.index');
    Route::post('/banned-ips', [BannedIpController::class, 'store'])->name('banned-ips.store');
    Route::delete('/banned-ips/{bannedIp}', [BannedIpController::class, 'destroy'])->name('banned-ips.destroy');
    
    Route::get('/logs', [LogExplorerController::class, 'index'])->name('logs.index');

    Route::post('logout', [AuthController::class, 'logout'])->name('logout');
});

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});
