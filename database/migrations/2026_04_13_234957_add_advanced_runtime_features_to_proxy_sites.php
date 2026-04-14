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
            $table->boolean('bot_challenge_mode')->default(false)->after('block_common_bad_bots');
            $table->boolean('bot_challenge_force')->default(false)->after('bot_challenge_mode');
            $table->json('route_policies')->nullable()->after('bot_challenge_mode');
            $table->boolean('circuit_breaker_enabled')->default(false)->after('route_policies');
            $table->unsignedTinyInteger('circuit_breaker_threshold')->default(5)->after('circuit_breaker_enabled');
            $table->unsignedSmallInteger('circuit_breaker_retry_seconds')->default(30)->after('circuit_breaker_threshold');
            $table->timestamp('circuit_breaker_opened_at')->nullable()->after('circuit_breaker_retry_seconds');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('proxy_sites', function (Blueprint $table) {
            $table->dropColumn([
                'bot_challenge_mode',
                'route_policies',
                'circuit_breaker_enabled',
                'circuit_breaker_threshold',
                'circuit_breaker_retry_seconds',
                'circuit_breaker_opened_at',
            ]);
        });
    }
};
