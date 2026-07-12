<?php

namespace App\Policies;

use App\Models\Brand;
use App\Models\User;

class BrandPolicy
{
    public function view(User $user, Brand $brand): bool
    {
        return $brand->tenant_id === $user->currentTenantId();
    }

    public function update(User $user, Brand $brand): bool
    {
        return $brand->tenant_id === $user->currentTenantId();
    }

    public function delete(User $user, Brand $brand): bool
    {
        return $brand->tenant_id === $user->currentTenantId();
    }
}
