<?php

namespace App\Http\Controllers;

use App\Models\SecurityEvent;
use Inertia\Inertia;

class AnalyticsController extends Controller
{
    public function index()
    {
        // 1. Events over time (last 30 days)
        $eventsOverTime = SecurityEvent::selectRaw('DATE(created_at) as date, count(*) as count')
            ->where('created_at', '>=', now()->subDays(30))
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        // 2. Types distribution
        $typeDistribution = SecurityEvent::selectRaw('type, count(*) as count')
            ->groupBy('type')
            ->get();

        // 3. Top Targeted Sites
        $topSites = SecurityEvent::selectRaw('proxy_site_id, count(*) as count')
            ->with('proxySite:id,name,domain')
            ->groupBy('proxy_site_id')
            ->orderByDesc('count')
            ->limit(5)
            ->get();

        // 4. Top Attackers (IPs)
        $topAttackerIps = SecurityEvent::selectRaw('ip_address, count(*) as count')
            ->groupBy('ip_address')
            ->orderByDesc('count')
            ->limit(10)
            ->get();

        // 5. Methods distribution
        $methodDistribution = SecurityEvent::selectRaw('request_method, count(*) as count')
            ->groupBy('request_method')
            ->get();

        return Inertia::render('Analytics/Index', [
            'eventsOverTime' => $eventsOverTime,
            'typeDistribution' => $typeDistribution,
            'topSites' => $topSites,
            'topAttackerIps' => $topAttackerIps,
            'methodDistribution' => $methodDistribution,
            'totalEvents' => SecurityEvent::count(),
            'uniqueIps' => SecurityEvent::distinct('ip_address')->count('ip_address'),
        ]);
    }
}
