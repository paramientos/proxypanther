<?php

namespace App\Http\Controllers;

use App\Models\BannedIp;
use App\Models\ProxySite;
use App\Models\SecurityEvent;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SearchController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $q = trim((string) $request->get('q', ''));

        if (strlen($q) < 2) {
            return response()->json([]);
        }

        $results = [];

        ProxySite::where('name', 'like', "%{$q}%")
            ->orWhere('domain', 'like', "%{$q}%")
            ->limit(5)
            ->get()
            ->each(function ($site) use (&$results) {
                $results[] = [
                    'type'     => 'site',
                    'label'    => $site->name,
                    'sublabel' => $site->domain,
                    'url'      => route('sites.show', $site),
                ];
            });

        SecurityEvent::where('ip_address', 'like', "%{$q}%")
            ->orWhere('request_path', 'like', "%{$q}%")
            ->orWhere('type', 'like', "%{$q}%")
            ->latest()
            ->limit(5)
            ->get()
            ->each(function ($event) use (&$results) {
                $results[] = [
                    'type'     => 'log',
                    'label'    => $event->type . ' — ' . $event->ip_address,
                    'sublabel' => $event->request_path,
                    'url'      => route('logs.index', ['search' => $event->ip_address]),
                ];
            });

        BannedIp::where('ip_address', 'like', "%{$q}%")
            ->orWhere('reason', 'like', "%{$q}%")
            ->limit(3)
            ->get()
            ->each(function ($ip) use (&$results) {
                $results[] = [
                    'type'     => 'ip',
                    'label'    => $ip->ip_address,
                    'sublabel' => $ip->reason ?: 'Banned IP',
                    'url'      => route('banned-ips.index'),
                ];
            });

        return response()->json($results);
    }
}
