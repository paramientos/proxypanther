<?php

namespace App\Console\Commands;

use App\Services\CaddyService;
use Illuminate\Console\Command;

class SyncCaddyCommand extends Command
{
    protected $signature = 'sync:caddy';

    protected $description = 'Sync all active proxy sites to Caddyfile and reload Caddy';

    /**
     * Execute the console command.
     */
    public function handle(CaddyService $caddy)
    {
        $this->info('Syncing Caddy configuration...');

        if ($caddy->sync()) {
            $this->info('Caddy synchronized and reloaded successfully.');
        } else {
            $this->error('Failed to reload Caddy. Check if Caddy is running.');
        }
    }
}
