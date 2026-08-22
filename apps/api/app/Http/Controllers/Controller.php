<?php

namespace App\Http\Controllers;

use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

abstract class Controller
{
    use AuthorizesRequests;

    protected function tenantId(): int
    {
        return (app()->bound('current_tenant') ? app('current_tenant')?->id : null) ?? auth()->user()->currentTenantId();
    }
}
