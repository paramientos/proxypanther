<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('proxy_sites', function (Blueprint $table) {
            $table->json('geoip_allowlist')->nullable()->after('ip_denylist');
            $table->json('geoip_denylist')->nullable()->after('geoip_allowlist');
            $table->boolean('geoip_enabled')->default(false)->after('geoip_denylist');
        });
    }

    public function down(): void
    {
        Schema::table('proxy_sites', function (Blueprint $table) {
            $table->dropColumn(['geoip_allowlist', 'geoip_denylist', 'geoip_enabled']);
        });
    }
};
