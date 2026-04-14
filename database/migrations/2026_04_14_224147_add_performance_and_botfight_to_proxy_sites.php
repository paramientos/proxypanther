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
            $table->boolean('bot_fight_mode')->default(false)->after('bot_challenge_mode');
            $table->boolean('brotli_enabled')->default(true)->after('cache_enabled');
            $table->boolean('hsts_enabled')->default(false)->after('ssl_enabled');
            $table->string('performance_level')->default('balanced')->after('brotli_enabled'); // balanced, aggressive, off
        });
    }

    public function down(): void
    {
        Schema::table('proxy_sites', function (Blueprint $table) {
            $table->dropColumn(['bot_fight_mode', 'brotli_enabled', 'hsts_enabled', 'performance_level']);
        });
    }
};
