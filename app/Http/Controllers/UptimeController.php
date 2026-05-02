<?php

namespace App\Http\Controllers;

use App\Models\ProxySite;
use App\Models\UptimeEvent;
use Inertia\Inertia;

class UptimeController extends Controller
{
    public function index()
    {
        $sites = ProxySite::select([
            'id', 'name', 'domain', 'is_online', 'last_check_at',
            'uptime_percentage', 'total_downtime_seconds', 'monitoring_started_at',
        ])->get()->map(function ($site) {
            // uptime_percentage stored as 0-10000 (100.00% = 10000)
            $site->uptime_pct = number_format($site->uptime_percentage / 100, 2);

            return $site;
        });

        // Last 30 days downtime events per site
        $events = UptimeEvent::where('created_at', '>=', now()->subDays(30))
            ->orderBy('created_at')
            ->get()
            ->groupBy('proxy_site_id');

        return Inertia::render('Uptime/Index', [
            'sites' => $sites,
            'events' => $events,
        ]);
    }
}
