<?php

namespace App\Http\Controllers\Api;

use App\Application\Settings\Actions\BootstrapSettingsAction;
use App\Application\Settings\Actions\GetTenantSettingsAction;
use App\Application\Settings\Actions\UpdateTenantSettingsAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\UpdateTenantSettingRequest;
use App\Http\Resources\ApiResponse;
use App\Http\Resources\Settings\FiscalYearResource;
use App\Http\Resources\Settings\TenantResource;
use App\Http\Resources\Settings\TenantSettingResource;
use Illuminate\Http\JsonResponse;

class TenantSettingController extends Controller
{
    public function bootstrap(BootstrapSettingsAction $action): JsonResponse
    {
        $data = $action->execute($this->tenantId());

        return ApiResponse::success(
            [
                'tenant'       => new TenantResource($data['tenant']),
                'settings'     => new TenantSettingResource($data['settings']),
                'fiscal_years' => FiscalYearResource::collection($data['fiscal_years']),
            ],
            'Settings bootstrap loaded'
        );
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
