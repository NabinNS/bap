<?php

namespace App\Policies;

use App\Models\Category;
use App\Models\User;

class CategoryPolicy
{
    public function view(User $user, Category $category): bool
    {
        return $category->tenant_id === $user->currentTenantId();
    }

    public function update(User $user, Category $category): bool
    {
        return $category->tenant_id === $user->currentTenantId();
    }

    public function delete(User $user, Category $category): bool
    {
        return $category->tenant_id === $user->currentTenantId();
    }
}
