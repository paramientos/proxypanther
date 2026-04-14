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
        Schema::table('security_events', function (Blueprint $table) {
            $table->string('country_code', 5)->nullable()->after('ip_address');
            $table->string('country_name', 100)->nullable()->after('country_code');
            $table->string('city', 100)->nullable()->after('country_name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('security_events', function (Blueprint $table) {
            $table->dropColumn(['country_code', 'country_name', 'city']);
        });
    }
};
