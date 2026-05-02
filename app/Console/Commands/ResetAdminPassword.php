<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class ResetAdminPassword extends Command
{
    protected $signature = 'admin:reset-password {email? : Admin email address} {--password= : Set a specific password}';

    protected $description = 'Reset the admin user password';

    public function handle(): int
    {
        $email = $this->argument('email') ?? 'admin@proxypanther.com';

        $user = User::where('email', $email)->first();

        if (! $user) {
            $this->error("No user found with email: {$email}");

            return self::FAILURE;
        }

        $password = $this->option('password') ?? Str::password(16, symbols: false);

        $user->update(['password' => Hash::make($password)]);

        $this->info('Password reset successfully.');
        $this->table(['Field', 'Value'], [
            ['Email',    $user->email],
            ['Password', $password],
        ]);

        $this->warn('Save this password — it will not be shown again.');

        return self::SUCCESS;
    }
}
