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
            $table->integer('rate_limit_burst')->default(10)->after('rate_limit_rps');
            $table->string('rate_limit_action')->default('block')->after('rate_limit_burst'); // block or delay
        });
    }

    public function down(): void
    {
        Schema::table('proxy_sites', function (Blueprint $table) {
            $table->dropColumn(['rate_limit_burst', 'rate_limit_action']);
        });
    }
};
