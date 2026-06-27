<?php

namespace Database\Seeders;

use App\Models\Tenant;
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
    }
}
