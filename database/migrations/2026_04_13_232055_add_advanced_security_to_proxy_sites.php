<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('proxy_sites', function (Blueprint $table) {
            $table->text('custom_error_403')->nullable()->after('maintenance_message');
            $table->text('custom_error_503')->nullable()->after('custom_error_403');
            $table->json('ip_allowlist')->nullable()->after('custom_error_503');
            $table->json('ip_denylist')->nullable()->after('ip_allowlist');
            $table->boolean('block_common_bad_bots')->default(true)->after('waf_enabled');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('proxy_sites', function (Blueprint $table) {
            $table->dropColumn(['custom_error_403', 'custom_error_503', 'ip_allowlist', 'ip_denylist', 'block_common_bad_bots']);
        });
    }
};
