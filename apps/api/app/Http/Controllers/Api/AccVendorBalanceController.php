<?php

namespace App\Http\Controllers\Api;

use App\Application\AccVendors\Actions\UpsertAccVendorBalanceAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\AccVendors\UpsertAccVendorBalanceRequest;
use App\Http\Resources\AccVendors\AccVendorBalanceResource;
use App\Http\Resources\ApiResponse;
use App\Models\AccVendor;
use Illuminate\Http\JsonResponse;

class AccVendorBalanceController extends Controller
{
    public function upsert(UpsertAccVendorBalanceRequest $request, AccVendor $accVendor, UpsertAccVendorBalanceAction $action): JsonResponse
    {
        $this->authorize('update', $accVendor);

        return ApiResponse::success(
            new AccVendorBalanceResource($action->execute($this->tenantId(), $accVendor, $request->toDTO())),
            'Balance saved successfully'
        );
    }
}