<?php

namespace App\Http\Controllers;

use App\Models\AppSetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
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
            'mail_host'         => 'nullable|string|max:255',
            'mail_port'         => 'nullable|integer|min:1|max:65535',
            'mail_username'     => 'nullable|string|max:255',
            'mail_password'     => 'nullable|string|max:255',
            'mail_encryption'   => 'nullable|in:tls,ssl,starttls,',
            'mail_from_address' => 'nullable|email|max:255',
            'mail_from_name'    => 'nullable|string|max:255',
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
            'email' => 'required|email|unique:users,email,' . $user->id,
        ]);

        $user->update($validated);

        return redirect()->back()->with('success', 'Profile updated.');
    }

    public function updatePassword(Request $request): RedirectResponse
    {
        $request->validate([
            'current_password' => 'required|current_password',
            'password'         => 'required|min:8|confirmed',
        ]);

        auth()->user()->update([
            'password' => Hash::make($request->password),
        ]);

        return redirect()->back()->with('success', 'Password updated.');
    }

    public function testSmtp(Request $request): RedirectResponse
    {
        $request->validate(['email' => 'required|email']);

        try {
            Mail::raw('This is a test email from ProxyPanther.', function ($msg) use ($request) {
                $msg->to($request->email)->subject('ProxyPanther — SMTP Test');
            });
            return redirect()->back()->with('success', 'Test email sent successfully.');
        } catch (\Exception $e) {
            return redirect()->back()->withErrors(['smtp' => 'Failed: ' . $e->getMessage()]);
        }
    }
}
