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
        Schema::create('config_audits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('proxy_site_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('action', 50);
            $table->json('before_state')->nullable();
            $table->json('after_state')->nullable();
            $table->foreignId('rollback_of_audit_id')->nullable()->constrained('config_audits')->nullOnDelete();
            $table->timestamps();

            $table->index(['proxy_site_id', 'created_at']);
            $table->index(['action', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('config_audits');
    }
};
