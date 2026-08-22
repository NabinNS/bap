<?php

namespace App\Http\Controllers\Api;

use App\Application\Settings\Actions\GetTenantSettingsAction;
use App\Application\Settings\Actions\UpdateTenantSettingsAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\UpdateTenantSettingRequest;
use App\Http\Resources\ApiResponse;
use App\Http\Resources\Settings\FiscalYearResource;
use App\Http\Resources\Settings\TenantSettingResource;
use App\Models\FiscalYear;
use App\Models\Tenant;
use Illuminate\Http\JsonResponse;

class TenantSettingController extends Controller
{
    public function bootstrap(GetTenantSettingsAction $action): JsonResponse
    {
        $tenantId = $this->tenantId();
        $tenant   = Tenant::findOrFail($tenantId);
        $setting  = $action->execute($tenantId);
        $fiscalYears = FiscalYear::orderBy('sort_order')->get();

        return ApiResponse::success([
            'tenant'       => [
                'ulid'    => $tenant->ulid,
                'name'    => $tenant->name,
                'email'   => $tenant->email,
                'phone'   => $tenant->phone,
                'address' => $tenant->address,
                'vat_no'  => $tenant->vat_no ?? null,
            ],
            'settings'     => new TenantSettingResource($setting),
            'fiscal_years' => FiscalYearResource::collection($fiscalYears),
        ], 'Settings bootstrap loaded');
    }

    public function show(GetTenantSettingsAction $action): JsonResponse
    {
        $setting = $action->execute($this->tenantId());

        return ApiResponse::success(
            new TenantSettingResource($setting),
            'Settings retrieved successfully'
        );
    }

    public function update(UpdateTenantSettingRequest $request, GetTenantSettingsAction $getAction, UpdateTenantSettingsAction $updateAction): JsonResponse
    {
        $setting = $getAction->execute($this->tenantId());
        $updated = $updateAction->execute($setting, $request->toDTO());

        return ApiResponse::success(
            new TenantSettingResource($updated),
            'Settings updated successfully'
        );
    }
}
