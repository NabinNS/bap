<?php

namespace App\Http\Controllers\Api;

use App\Application\AccVendors\Actions\ListAccVendorTransactionsAction;
use App\Application\AccVendors\Actions\StoreAccVendorTransactionAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\AccVendors\StoreAccVendorTransactionRequest;
use App\Http\Resources\AccVendors\AccVendorTransactionResource;
use App\Http\Resources\ApiResponse;
use App\Models\AccVendor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AccVendorTransactionController extends Controller
{
    public function index(Request $request, AccVendor $accVendor, ListAccVendorTransactionsAction $action): JsonResponse
    {
        $this->authorize('view', $accVendor);

        return ApiResponse::paginated(
            $action->execute($accVendor, $request->integer('per_page', 50)),
            AccVendorTransactionResource::class,
            'Transactions retrieved successfully'
        );
    }

    public function store(StoreAccVendorTransactionRequest $request, AccVendor $accVendor, StoreAccVendorTransactionAction $action): JsonResponse
    {
        $this->authorize('update', $accVendor);

        $transaction = $action->execute($this->tenantId(), $accVendor, $request->validated());

        return ApiResponse::success(
            new AccVendorTransactionResource($transaction),
            'Transaction created successfully',
            201
        );
    }
}
