<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class FiscalYearSeeder extends Seeder
{
    public function run(): void
    {
        $fiscalYears = [
            ['name' => '2078/79', 'sort_order' => 1],
            ['name' => '2079/80', 'sort_order' => 2],
            ['name' => '2080/81', 'sort_order' => 3],
            ['name' => '2081/82', 'sort_order' => 4],
            ['name' => '2082/83', 'sort_order' => 5],
            ['name' => '2083/84', 'sort_order' => 6],
            ['name' => '2084/85', 'sort_order' => 7],
            ['name' => '2085/86', 'sort_order' => 8],
            ['name' => '2086/87', 'sort_order' => 9],
            ['name' => '2087/88', 'sort_order' => 10],
        ];

        foreach ($fiscalYears as $fy) {
            DB::table('fiscal_years')->insertOrIgnore([
                'ulid'       => Str::ulid(),
                'name'       => $fy['name'],
                'sort_order' => $fy['sort_order'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}
