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
            ['name' => '2073/74', 'sort_order' => 1],
            ['name' => '2074/75', 'sort_order' => 2],
            ['name' => '2075/76', 'sort_order' => 3],
            ['name' => '2076/77', 'sort_order' => 4],
            ['name' => '2077/78', 'sort_order' => 5],
            ['name' => '2078/79', 'sort_order' => 6],
            ['name' => '2079/80', 'sort_order' => 7],
            ['name' => '2080/81', 'sort_order' => 8],
            ['name' => '2081/82', 'sort_order' => 9],
            ['name' => '2082/83', 'sort_order' => 10],
            ['name' => '2083/84', 'sort_order' => 11],
        ];

        foreach ($fiscalYears as $fy) {
            // Keep the existing row's ulid untouched on re-seed (it may already be referenced
            // by the frontend/other records) — only set it when the row is first created.
            $existing = DB::table('fiscal_years')->where('name', $fy['name'])->first();

            DB::table('fiscal_years')->updateOrInsert(
                ['name' => $fy['name']],
                [
                    'ulid'       => $existing->ulid ?? (string) Str::ulid(),
                    'sort_order' => $fy['sort_order'],
                    'updated_at' => now(),
                    'created_at' => $existing->created_at ?? now(),
                ],
            );
        }
    }
}
