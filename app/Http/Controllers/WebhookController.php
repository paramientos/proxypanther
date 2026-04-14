<?php

namespace App\Http\Controllers;

use App\Models\ProxySite;
use App\Services\CaddyService;
use Illuminate\Http\Request;

class WebhookController extends Controller
{
    public function __construct(protected CaddyService $caddy) {}

    /**
     * Handle incoming webhook from PingPanther or external monitoring.
     * Token matches proxy site's notification_webhook_url token segment.
     */
    public function handle(Request $request, string $token)
    {
        $site = ProxySite::where('notification_webhook_url', 'like', "%{$token}%")->first();

        if (!$site) {
            return response()->json(['error' => 'Unknown token'], 404);
        }

        $action = $request->input('action');

        if ($action === 'failover') {
            // PingPanther detected downtime - enable maintenance or failover
            $site->update(['is_maintenance' => true]);
            $this->caddy->sync();
            return response()->json(['status' => 'failover activated']);
        }

        if ($action === 'recover') {
            $site->update(['is_maintenance' => false]);
            $this->caddy->sync();
            return response()->json(['status' => 'recovery activated']);
        }

        return response()->json(['status' => 'received', 'site' => $site->domain]);
    }
}
