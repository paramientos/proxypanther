<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('proxy_sites', function (Blueprint $table) {
            $table->json('header_rules')->nullable()->after('env_vars');
            $table->json('redirect_rules')->nullable()->after('header_rules');
        });
    }

    public function down(): void
    {
        Schema::table('proxy_sites', function (Blueprint $table) {
            $table->dropColumn(['header_rules', 'redirect_rules']);
        });
    }
};
