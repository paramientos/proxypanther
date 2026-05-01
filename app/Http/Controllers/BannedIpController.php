<?php

namespace App\Http\Controllers;

use App\Models\BannedIp;
use App\Services\CaddyService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BannedIpController extends Controller
{
    public function __construct(protected CaddyService $caddy) {}

    public function index()
    {
        return Inertia::render('BannedIps/Index', [
            'bannedIps' => BannedIp::latest()->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'ip_address' => 'required|ip|unique:banned_ips,ip_address',
            'reason' => 'nullable|string|max:255',
        ]);

        BannedIp::create($validated);
        $this->caddy->sync();

        return redirect()->back()->with('success', 'IP address banned successfully.');
    }

    public function destroy(BannedIp $bannedIp)
    {
        $bannedIp->delete();
        $this->caddy->sync();

        return redirect()->back()->with('success', 'IP address unbanned successfully.');
    }
}
