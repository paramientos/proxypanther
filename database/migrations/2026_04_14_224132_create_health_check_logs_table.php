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
        Schema::create('health_check_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('proxy_site_id')->constrained()->onDelete('cascade');
            $table->string('status'); // UP, DOWN, DEGRADED
            $table->integer('response_code')->nullable();
            $table->float('latency')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamp('created_at')->index();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('health_check_logs');
    }
};
