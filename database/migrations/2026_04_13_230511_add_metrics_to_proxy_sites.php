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
            $table->unsignedBigInteger('hits_2xx')->default(0);
            $table->unsignedBigInteger('hits_4xx')->default(0);
            $table->unsignedBigInteger('hits_5xx')->default(0);
            $table->float('avg_latency_ms')->default(0);
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
