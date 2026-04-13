<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use App\Models\BannedIp;
use Illuminate\Database\Seeder;

class BannedIpSeeder extends Seeder
{
    public function run(): void
    {
        BannedIp::create([
            'ip_address' => '1.2.3.4',
            'reason' => 'Known bot network',
        ]);

        BannedIp::create([
            'ip_address' => '5.6.7.8',
            'reason' => 'Repeated SQLi attempts',
        ]);
    }
}
