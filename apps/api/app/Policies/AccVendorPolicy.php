<?php

namespace App\Policies;

use App\Models\AccVendor;
use App\Models\User;

class AccVendorPolicy
{
    public function view(User $user, AccVendor $vendor): bool
    {
        return $vendor->tenant_id === $user->currentTenantId();
    }

    public function update(User $user, AccVendor $vendor): bool
    {
        return $vendor->tenant_id === $user->currentTenantId();
    }

    public function delete(User $user, AccVendor $vendor): bool
    {
        return $vendor->tenant_id === $user->currentTenantId();
    }
}

