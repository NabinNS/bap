<?php

namespace App\Providers;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\ServiceProvider;

class SeederServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        $this->seedFiscalYearsIfEmpty();
    }

    private function seedFiscalYearsIfEmpty(): void
    {
        try {
            if (DB::table('fiscal_years')->exists()) {
                return;
            }

            $this->app->make(\Database\Seeders\FiscalYearSeeder::class)->run();
        } catch (\Throwable) {
            // Table may not exist yet during initial migration — skip silently.
        }
    }
}
