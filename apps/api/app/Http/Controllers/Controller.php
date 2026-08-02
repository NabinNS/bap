<?php

namespace App\Http\Controllers;

use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;

abstract class Controller
{
    use AuthorizesRequests;

    protected function tenantId(Request $request): int
    {
        if (app()->bound('current_tenant')) {
            return app('current_tenant')->id;
        }

        return $request->user()->currentTenantId();
    }
}
