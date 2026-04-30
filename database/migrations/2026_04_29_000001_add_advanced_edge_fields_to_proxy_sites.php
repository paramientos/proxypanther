<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('proxy_sites', function (Blueprint $table) {
            $table->json('advanced_routes')->nullable()->after('route_policies');
            $table->json('forward_auth')->nullable()->after('advanced_routes');
        });
    }

    public function down(): void
    {
        Schema::table('proxy_sites', function (Blueprint $table) {
            $table->dropColumn(['advanced_routes', 'forward_auth']);
        });
    }
};
