<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('proxy_sites', function (Blueprint $table) {
            $table->unsignedBigInteger('bytes_in')->default(0)->after('hits_5xx');
            $table->unsignedBigInteger('bytes_out')->default(0)->after('bytes_in');
            $table->unsignedSmallInteger('uptime_percentage')->default(10000)->after('bytes_out');
            $table->unsignedInteger('total_downtime_seconds')->default(0)->after('uptime_percentage');
            $table->timestamp('monitoring_started_at')->nullable()->after('total_downtime_seconds');
        });
    }

    public function down(): void
    {
        Schema::table('proxy_sites', function (Blueprint $table) {
            $table->dropColumn(['bytes_in', 'bytes_out', 'uptime_percentage', 'total_downtime_seconds', 'monitoring_started_at']);
        });
    }
};
