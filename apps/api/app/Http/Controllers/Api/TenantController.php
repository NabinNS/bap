<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ApiResponse;
use App\Http\Resources\Settings\TenantResource;
use App\Models\Tenant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TenantController extends Controller
{
    public function show(): JsonResponse
    {
        $tenant = Tenant::findOrFail($this->tenantId());

        return ApiResponse::success(
            new TenantResource($tenant),
            'Tenant retrieved successfully'
        );
    }

    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'    => ['required', 'string', 'max:255'],
            'email'   => ['nullable', 'email', 'max:255'],
            'phone'   => ['nullable', 'string', 'max:20'],
            'address' => ['nullable', 'string', 'max:500'],
            'vat_no'  => ['nullable', 'string', 'max:50'],
        ]);

        $tenant = Tenant::findOrFail($this->tenantId());
        $tenant->update($validated);

        return ApiResponse::success(
            new TenantResource($tenant),
            'Tenant updated successfully'
        );
    }
}
