<?php

namespace App\Policies;

use App\Models\Offer;
use App\Models\User;

class OfferPolicy
{
    public function view(User $user, Offer $offer): bool
    {
        return $offer->tenant_id === $user->currentTenantId();
    }

    public function update(User $user, Offer $offer): bool
    {
        return $offer->tenant_id === $user->currentTenantId();
    }

    public function delete(User $user, Offer $offer): bool
    {
        return $offer->tenant_id === $user->currentTenantId();
    }
}
