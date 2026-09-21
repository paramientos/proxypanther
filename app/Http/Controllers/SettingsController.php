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
            'smtp' => AppSetting::getGroup($this->smtpKeys),
            'app' => AppSetting::getGroup($this->appKeys),
            'profile' => [
                'name' => $user->name,
                'email' => $user->email,
            ],
            'sshWhitelist' => AppSetting::get('ssh_whitelist', ''),
        ]);
    }

    public function updateSmtp(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'mail_mailer' => 'required|in:smtp,log,sendmail',
            'mail_host' => 'required_if:mail_mailer,smtp|nullable|string|max:255',
            'mail_port' => 'required_if:mail_mailer,smtp|nullable|string|max:5',
            'mail_username' => 'required_if:mail_mailer,smtp|nullable|string|max:255',
            'mail_password' => 'required_if:mail_mailer,smtp|nullable|string|max:255',
            'mail_encryption' => 'nullable|string|in:tls,ssl,starttls',
            'mail_from_address' => 'required|email|max:255',
            'mail_from_name' => 'required|string|max:255',
        ]);

        AppSetting::setMany($validated);

        return redirect()->back()->with('success', 'Mail settings saved.');
    }

    public function updateApp(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'app_name' => 'required|string|max:100',
            'app_url' => 'required|url|max:255',
            'app_timezone' => 'required|timezone',
        ]);

        AppSetting::setMany($validated);

        return redirect()->back()->with('success', 'Application settings saved.');
    }

    public function updateProfile(Request $request): RedirectResponse
    {
        $user = auth()->user();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => "required|email|unique:users,email,{$user->id}",
        ]);

        $emailChanged = $validated['email'] !== $user->email;

        $user->update($validated);

        if ($emailChanged) {
            Auth::logoutOtherDevices($request->input('current_password', ''));
            Auth::logout();
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
            'password' => 'required|min:8|confirmed',
        ]);

        $user = auth()->user();

        $user->update([
            'password' => Hash::make($request->password),
        ]);

        Auth::logoutOtherDevices($request->password);
        Auth::logout();
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
                'mail.default' => 'smtp',
                'mail.mailers.smtp.host' => $host,
                'mail.mailers.smtp.port' => $port,
                'mail.mailers.smtp.encryption' => AppSetting::get('mail_encryption') ?: null,
                'mail.mailers.smtp.username' => AppSetting::get('mail_username'),
                'mail.mailers.smtp.password' => AppSetting::get('mail_password'),
                'mail.from.address' => AppSetting::get('mail_from_address'),
                'mail.from.name' => AppSetting::get('mail_from_name', 'ProxyPanther'),
            ]);

            $mailerInstance = app('mail.manager')->mailer('smtp');

            $mailerInstance->raw('This is a test email from ProxyPanther.', function ($msg) use ($request) {
                $msg->to($request->email)->subject('ProxyPanther — SMTP Test');
            });

            return redirect()->back()->with('success', 'Test email sent successfully.');
        } catch (\Exception $e) {
            return redirect()->back()->withErrors(['smtp' => 'Failed: '.$e->getMessage()]);
        }
    }

    public function updateSshWhitelist(Request $request): RedirectResponse
    {
        $request->validate([
            'ssh_whitelist' => 'nullable|string|max:2000',
        ]);

        $raw = $request->input('ssh_whitelist', '');

        $ips = collect(preg_split('/[\s,]+/', $raw, -1, PREG_SPLIT_NO_EMPTY))
            ->filter(fn ($ip) => filter_var(trim($ip), FILTER_VALIDATE_IP)
                || preg_match('/^\d{1,3}(\.\d{1,3}){0,3}\/\d{1,2}$/', trim($ip)))
            ->values()
            ->all();

        AppSetting::set('ssh_whitelist', implode("\n", $ips));

        $this->applySshFirewallRules($ips);

        return redirect()->back()->with('success', 'SSH whitelist updated.');
    }

    private function applySshFirewallRules(array $ips): void
    {
        if (PHP_OS_FAMILY !== 'Linux' || empty($ips)) {
            return;
        }

        if (shell_exec('command -v ufw 2>/dev/null')) {
            shell_exec('ufw delete allow 22/tcp 2>/dev/null');
            foreach ($ips as $ip) {
                shell_exec("ufw allow from {$ip} to any port 22 proto tcp 2>/dev/null");
            }
            shell_exec('ufw --force reload 2>/dev/null');
        } elseif (shell_exec('command -v firewall-cmd 2>/dev/null')) {
            shell_exec('firewall-cmd --permanent --remove-service=ssh 2>/dev/null');
            foreach ($ips as $ip) {
                shell_exec("firewall-cmd --permanent --add-rich-rule='rule family=ipv4 source address={$ip} service name=ssh accept' 2>/dev/null");
            }
            shell_exec('firewall-cmd --reload 2>/dev/null');
        } elseif (shell_exec('command -v iptables 2>/dev/null')) {
            shell_exec('iptables -D INPUT -p tcp --dport 22 -j ACCEPT 2>/dev/null');
            foreach ($ips as $ip) {
                shell_exec("iptables -I INPUT -p tcp --dport 22 -s {$ip} -j ACCEPT 2>/dev/null");
            }
            shell_exec('iptables -A INPUT -p tcp --dport 22 -j DROP 2>/dev/null');
            shell_exec('iptables-save > /etc/iptables/rules.v4 2>/dev/null');
        }
    }
}
