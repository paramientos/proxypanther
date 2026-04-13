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
            $table->string('backup_backend_url')->nullable()->after('backend_url');
            $table->json('custom_waf_rules')->nullable()->after('block_common_bad_bots');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('proxy_sites', function (Blueprint $table) {
            $table->dropColumn(['backup_backend_url', 'custom_waf_rules']);
        });
    }
};
