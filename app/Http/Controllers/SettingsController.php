<?php

namespace App\Http\Controllers;

use App\Models\AppSetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class SettingsController extends Controller
{
    private array $smtpKeys = [
        'mail_mailer', 'mail_host', 'mail_port',
        'mail_username', 'mail_password', 'mail_encryption',
        'mail_from_address', 'mail_from_name',
    ];

    private array $appKeys = [
        'app_name', 'app_url', 'app_timezone',
    ];

    public function index(): Response
    {
        $user = auth()->user();

        return Inertia::render('Settings/Index', [
            'smtp'    => AppSetting::getGroup($this->smtpKeys),
            'app'     => AppSetting::getGroup($this->appKeys),
            'profile' => [
                'name'  => $user->name,
                'email' => $user->email,
            ],
        ]);
    }

    public function updateSmtp(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'mail_mailer'       => 'required|in:smtp,log,sendmail',
            'mail_host'         => 'required_if:mail_mailer,smtp|nullable|string|max:255',
            'mail_port'         => 'required_if:mail_mailer,smtp|nullable|string|max:5',
            'mail_username'     => 'required_if:mail_mailer,smtp|nullable|string|max:255',
            'mail_password'     => 'required_if:mail_mailer,smtp|nullable|string|max:255',
            'mail_encryption'   => 'nullable|string|in:tls,ssl,starttls',
            'mail_from_address' => 'required|email|max:255',
            'mail_from_name'    => 'required|string|max:255',
        ]);

        AppSetting::setMany($validated);

        return redirect()->back()->with('success', 'Mail settings saved.');
    }

    public function updateApp(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'app_name'     => 'required|string|max:100',
            'app_url'      => 'required|url|max:255',
            'app_timezone' => 'required|timezone',
        ]);

        AppSetting::setMany($validated);

        return redirect()->back()->with('success', 'Application settings saved.');
    }

    public function updateProfile(Request $request): RedirectResponse
    {
        $user = auth()->user();

        $validated = $request->validate([
            'name'  => 'required|string|max:255',
            'email' => "required|email|unique:users,email,{$user->id}",
        ]);

        $emailChanged = $validated['email'] !== $user->email;

        $user->update($validated);

        if ($emailChanged) {
            Auth::logoutOtherDevices($request->input('current_password', ''));
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return redirect()->route('login')->with('success', 'Email updated. Please log in again.');
        }

        return redirect()->back()->with('success', 'Profile updated.');
    }

    public function updatePassword(Request $request): RedirectResponse
    {
        $request->validate([
            'current_password' => 'required|current_password',
            'password'         => 'required|min:8|confirmed',
        ]);

        $user = auth()->user();

        $user->update([
            'password' => Hash::make($request->password),
        ]);

        Auth::logoutOtherDevices($request->password);
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login')->with('success', 'Password updated. Please log in again.');
    }

    public function testSmtp(Request $request): RedirectResponse
    {
        $request->validate(['email' => 'required|email']);

        $mailer = AppSetting::get('mail_mailer', 'log');

        if ($mailer !== 'smtp') {
            return redirect()->back()->withErrors(['smtp' => 'SMTP is not configured as the mail driver. Please save your mail settings first.']);
        }

        $host = AppSetting::get('mail_host');
        $port = AppSetting::get('mail_port');

        if (! $host || ! $port) {
            return redirect()->back()->withErrors(['smtp' => 'SMTP host and port are required. Please save your mail settings first.']);
        }

        try {
            config([
                'mail.default'                    => 'smtp',
                'mail.mailers.smtp.host'          => $host,
                'mail.mailers.smtp.port'          => $port,
                'mail.mailers.smtp.encryption'    => AppSetting::get('mail_encryption') ?: null,
                'mail.mailers.smtp.username'      => AppSetting::get('mail_username'),
                'mail.mailers.smtp.password'      => AppSetting::get('mail_password'),
                'mail.from.address'               => AppSetting::get('mail_from_address'),
                'mail.from.name'                  => AppSetting::get('mail_from_name', 'ProxyPanther'),
            ]);

            $mailerInstance = app('mail.manager')->mailer('smtp');

            $mailerInstance->raw('This is a test email from ProxyPanther.', function ($msg) use ($request) {
                $msg->to($request->email)->subject('ProxyPanther — SMTP Test');
            });

            return redirect()->back()->with('success', 'Test email sent successfully.');
        } catch (\Exception $e) {
            return redirect()->back()->withErrors(['smtp' => 'Failed: ' . $e->getMessage()]);
        }
    }
}
