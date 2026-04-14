<?php

namespace App\Http\Controllers;

use App\Models\ProxySite;
use App\Services\CaddyService;
use Inertia\Inertia;

class SslController extends Controller
{
    public function __construct(protected CaddyService $caddy) {}

    public function index()
    {
        $sites = ProxySite::where('ssl_enabled', true)->get(['id', 'name', 'domain', 'is_online', 'last_check_at']);
        $certs = $this->caddy->getSslCertificates();

        return Inertia::render('Ssl/Index', [
            'sites' => $sites,
            'certs' => $certs,
        ]);
    }
}
