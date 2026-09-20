<?php

namespace App\Policies;

use App\Models\AccCustomer;
use App\Models\User;

class AccCustomerPolicy
{
    public function view(User $user, AccCustomer $customer): bool
    {
        return $customer->tenant_id === $user->currentTenantId();
    }

    public function update(User $user, AccCustomer $customer): bool
    {
        return $customer->tenant_id === $user->currentTenantId();
    }

    public function delete(User $user, AccCustomer $customer): bool
    {
        return $customer->tenant_id === $user->currentTenantId();
    }
}
