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

            // Explicitly defining user_id to avoid datatype mismatch with users.id (integer vs bigint)
            $table->unsignedInteger('user_id')->nullable();
            $table->foreign('user_id')->references('id')->on('users')->nullOnDelete();

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
