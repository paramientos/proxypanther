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
        Schema::create('page_rules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('proxy_site_id')->constrained()->onDelete('cascade');
            $table->string('path'); // e.g. /old-path/*
            $table->string('type'); // redirect, rewrite, header, cache_bypass
            $table->text('value')->nullable(); // Target URL or Header value
            $table->integer('priority')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('page_rules');
    }
};
