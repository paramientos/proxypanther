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
            $table->string('backend_type')->default('proxy'); // 'proxy' or 'php_fpm'
            $table->string('root_path')->nullable(); // Required for PHP-FPM
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
