<?php

namespace App\Http\Controllers;

use App\Models\SecurityEvent;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LogExplorerController extends Controller
{
    public function index(Request $request)
    {
        $query = SecurityEvent::with('proxySite')->latest();

        if ($request->has('search')) {
            $search = $request->get('search');
            $query->where(function($q) use ($search) {
                $q->where('ip_address', 'like', "%{$search}%")
                  ->orWhere('type', 'like', "%{$search}%")
                  ->orWhere('request_path', 'like', "%{$search}%");
            });
        }

        if ($request->has('site_id')) {
            $query->where('proxy_site_id', $request->get('site_id'));
        }

        return Inertia::render('Logs/Index', [
            'events' => $query->paginate(20)->withQueryString(),
            'filters' => $request->only(['search', 'site_id']),
        ]);
    }
}
