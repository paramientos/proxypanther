<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('uptime_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('proxy_site_id')->constrained()->cascadeOnDelete();
            $table->enum('type', ['down', 'up']);
            $table->string('reason')->nullable();
            $table->unsignedInteger('duration_seconds')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('uptime_events');
    }
};
