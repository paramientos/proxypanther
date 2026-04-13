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
            $table->string('auth_user')->nullable();
            $table->string('auth_password')->nullable();
            $table->boolean('protect_sensitive_files')->default(true);
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
