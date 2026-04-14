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
        Schema::create('daily_metrics', function (Blueprint $table) {
            $table->id();
            $table->foreignId('proxy_site_id')->constrained()->onDelete('cascade');
            $table->date('date');
            $table->unsignedBigInteger('total_requests')->default(0);
            $table->unsignedBigInteger('blocked_requests')->default(0);
            $table->unsignedBigInteger('hits_2xx')->default(0);
            $table->unsignedBigInteger('hits_4xx')->default(0);
            $table->unsignedBigInteger('hits_5xx')->default(0);
            $table->unsignedBigInteger('bytes_in')->default(0);
            $table->unsignedBigInteger('bytes_out')->default(0);
            $table->timestamps();

            $table->unique(['proxy_site_id', 'date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('daily_metrics');
    }
};
