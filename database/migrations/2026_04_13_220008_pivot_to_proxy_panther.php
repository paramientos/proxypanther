<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('deployments');
        Schema::dropIfExists('projects');

        Schema::create('proxy_sites', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('domain')->unique();
            $table->string('backend_url'); // e.g., http://localhost:8001
            $table->boolean('ssl_enabled')->default(true);
            $table->boolean('waf_enabled')->default(true);
            $table->integer('rate_limit_rps')->default(5);
            $table->boolean('is_active')->default(true);
            $table->unsignedBigInteger('total_requests')->default(0);
            $table->unsignedBigInteger('blocked_requests')->default(0);
            $table->timestamps();
        });

        Schema::create('security_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('proxy_site_id')->constrained('proxy_sites')->onDelete('cascade');
            $table->string('type'); // SQLi, XSS, RateLimit, Bot
            $table->string('ip_address');
            $table->string('user_agent')->nullable();
            $table->string('request_method');
            $table->string('request_path');
            $table->text('payload')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('security_events');
        Schema::dropIfExists('proxy_sites');
    }
};
