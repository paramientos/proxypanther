<?php

namespace App\Providers;

use App\Models\AppSetting;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void {}

    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);
        $this->injectDatabaseSettings();
    }

    private function injectDatabaseSettings(): void
    {
        try {
            $settings = Cache::remember('app_settings_all', 3600, function () {
                return AppSetting::all()->pluck('value', 'key')->toArray();
            });
        } catch (\Throwable) {
            return;
        }

        $this->applyMailSettings($settings);
        $this->applyAppSettings($settings);
    }

    private function applyMailSettings(array $s): void
    {
        $mailer = $s['mail_mailer'] ?? null;

        if (! $mailer) {
            return;
        }

        Config::set('mail.default', $mailer);

        Config::set('mail.mailers.smtp', [
            'transport' => 'smtp',
            'host' => $s['mail_host'] ?? config('mail.mailers.smtp.host'),
            'port' => $s['mail_port'] ?? config('mail.mailers.smtp.port'),
            'encryption' => $s['mail_encryption'] ?: null,
            'username' => $s['mail_username'] ?? config('mail.mailers.smtp.username'),
            'password' => $s['mail_password'] ?? config('mail.mailers.smtp.password'),
            'timeout' => null,
        ]);

        if (! empty($s['mail_from_address'])) {
            Config::set('mail.from.address', $s['mail_from_address']);
            Config::set('mail.from.name', $s['mail_from_name'] ?? config('mail.from.name'));
        }
    }

    private function applyAppSettings(array $s): void
    {
        if (! empty($s['app_name'])) {
            Config::set('app.name', $s['app_name']);
        }

        if (! empty($s['app_url'])) {
            Config::set('app.url', $s['app_url']);
        }

        if (! empty($s['app_timezone'])) {
            Config::set('app.timezone', $s['app_timezone']);
            date_default_timezone_set($s['app_timezone']);
        }
    }
}
