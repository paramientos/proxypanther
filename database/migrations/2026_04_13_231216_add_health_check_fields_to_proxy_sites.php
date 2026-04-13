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
            $table->boolean('is_online')->default(true)->after('is_active');
            $table->timestamp('last_check_at')->nullable()->after('is_online');
            $table->text('last_error')->nullable()->after('last_check_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('proxy_sites', function (Blueprint $table) {
            $table->dropColumn(['is_online', 'last_check_at', 'last_error']);
        });
    }
};
