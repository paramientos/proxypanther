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
            $table->boolean('cache_enabled')->default(false);
            $table->integer('cache_ttl')->default(3600); // 1 hour in seconds
            $table->boolean('is_maintenance')->default(false);
            $table->text('maintenance_message')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('proxy_sites', function (Blueprint $table) {
            //
        });
    }
};
