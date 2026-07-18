<?php

namespace App\Policies;

use App\Models\Slider;
use App\Models\User;

class SliderPolicy
{
    public function view(User $user, Slider $slider): bool
    {
        return $slider->tenant_id === $user->currentTenantId();
    }

    public function update(User $user, Slider $slider): bool
    {
        return $slider->tenant_id === $user->currentTenantId();
    }

    public function delete(User $user, Slider $slider): bool
    {
        return $slider->tenant_id === $user->currentTenantId();
    }
}
