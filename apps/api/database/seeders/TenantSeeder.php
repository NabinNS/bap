<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class TenantSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::where('email', 'admin@gmail.com')->firstOrFail();

        $tenantId = DB::table('tenants')->insertGetId([
            'name'       => 'Best Auto Parts',
            'slug'       => 'best-auto-parts',
            'email'      => 'contact@bestAutoparts.com',
            'phone'      => '+1-555-000-0000',
            'address'    => '123 Main Street, Kathmandu, Nepal',
            'status'     => 'active',
            'created_by' => $admin->id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('tenant_users')->insertOrIgnore([
            'tenant_id'  => $tenantId,
            'user_id'    => $admin->id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
