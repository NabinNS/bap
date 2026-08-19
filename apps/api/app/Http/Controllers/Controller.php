<?php

namespace App\Http\Controllers;

use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

abstract class Controller
{
    use AuthorizesRequests;

    protected function tenantId(): int
    {
        return app('current_tenant')?->id ?? auth()->user()->currentTenantId();
    }
}
