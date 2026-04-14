<?php

namespace App\Http\Controllers;

use App\Models\ProxySite;
use App\Models\SecurityEvent;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\StreamedResponse;

class LogExplorerController extends Controller
{
    public function index(Request $request)
    {
        $query = SecurityEvent::with('proxySite')->latest();

        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('ip_address', 'like', "%{$search}%")
                  ->orWhere('type', 'like', "%{$search}%")
                  ->orWhere('request_path', 'like', "%{$search}%")
                  ->orWhere('user_agent', 'like', "%{$search}%");
            });
        }

        if ($siteId = $request->get('site_id')) {
            $query->where('proxy_site_id', $siteId);
        }

        if ($type = $request->get('type')) {
            $query->where('type', $type);
        }

        if ($from = $request->get('from')) {
            $query->whereDate('created_at', '>=', $from);
        }

        if ($to = $request->get('to')) {
            $query->whereDate('created_at', '<=', $to);
        }

        return Inertia::render('Logs/Index', [
            'events'  => $query->paginate(50)->withQueryString(),
            'filters' => $request->only(['search', 'site_id', 'type', 'from', 'to']),
            'sites'   => ProxySite::select('id', 'name', 'domain')->get(),
            'types'   => SecurityEvent::distinct()->pluck('type'),
        ]);
    }

    public function export(Request $request): StreamedResponse
    {
        $query = SecurityEvent::with('proxySite')->latest();

        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('ip_address', 'like', "%{$search}%")
                  ->orWhere('type', 'like', "%{$search}%")
                  ->orWhere('request_path', 'like', "%{$search}%");
            });
        }
        if ($siteId = $request->get('site_id')) {
            $query->where('proxy_site_id', $siteId);
        }
        if ($type = $request->get('type')) {
            $query->where('type', $type);
        }
        if ($from = $request->get('from')) {
            $query->whereDate('created_at', '>=', $from);
        }
        if ($to = $request->get('to')) {
            $query->whereDate('created_at', '<=', $to);
        }

        return response()->streamDownload(function () use ($query) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['ID', 'Time', 'Site', 'IP Address', 'Type', 'Method', 'Path', 'User Agent']);

            $query->chunk(500, function ($events) use ($handle) {
                foreach ($events as $event) {
                    fputcsv($handle, [
                        $event->id,
                        $event->created_at->toIso8601String(),
                        $event->proxySite?->name ?? '',
                        $event->ip_address,
                        $event->type,
                        $event->request_method,
                        $event->request_path,
                        $event->user_agent,
                    ]);
                }
            });

            fclose($handle);
        }, 'security-events-' . now()->format('Y-m-d') . '.csv', [
            'Content-Type' => 'text/csv',
        ]);
    }
}
