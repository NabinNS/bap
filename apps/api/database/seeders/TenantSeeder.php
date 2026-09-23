<?php

namespace Database\Seeders;

use App\Models\Tenant;
use App\Models\TenantDomain;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class TenantSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::where('email', 'admin@gmail.com')->firstOrFail();

        $tenant = Tenant::firstOrCreate(
            ['slug' => 'best-auto-parts'],
            [
                'name'       => 'Best Auto Parts',
                'email'      => 'contact@bestAutoparts.com',
                'phone'      => '+1-555-000-0000',
                'address'    => '123 Main Street, Kathmandu, Nepal',
                'status'     => 'active',
                'created_by' => $admin->id,
            ]
        );

        DB::table('tenant_users')->insertOrIgnore([
            'tenant_id'  => $tenant->id,
            'user_id'    => $admin->id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Read requests (product/brand/category/slider/offer listing, see the "resolve.tenant"
        // route group) resolve the tenant from the request's Host header via this table, unlike
        // write requests which resolve it from the authenticated user — so local dev needs a row
        // for whatever host the browser actually hits, or listing silently 404s while
        // create/update keeps working (see: products appearing to vanish after a db reset).
        foreach (['localhost', '127.0.0.1'] as $domain) {
            TenantDomain::firstOrCreate(['domain' => $domain], ['tenant_id' => $tenant->id]);
        }
    }
}
