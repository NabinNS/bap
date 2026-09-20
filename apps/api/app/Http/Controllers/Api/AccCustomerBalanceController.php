<?php

namespace App\Http\Controllers\Api;

use App\Application\AccCustomers\Actions\UpsertAccCustomerBalanceAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\AccCustomers\UpsertAccCustomerBalanceRequest;
use App\Http\Resources\AccCustomers\AccCustomerBalanceResource;
use App\Http\Resources\ApiResponse;
use App\Models\AccCustomer;
use Illuminate\Http\JsonResponse;

class AccCustomerBalanceController extends Controller
{
    public function upsert(UpsertAccCustomerBalanceRequest $request, AccCustomer $accCustomer, UpsertAccCustomerBalanceAction $action): JsonResponse
    {
        $this->authorize('update', $accCustomer);

        return ApiResponse::success(
            new AccCustomerBalanceResource($action->execute($this->tenantId(), $accCustomer, $request->toDTO())),
            'Balance saved successfully'
        );
    }
}
