<?php

namespace App\Http\Controllers\Api;

use App\Application\ProductStockBalances\Actions\UpsertProductStockBalanceAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\ProductStockBalances\UpsertProductStockBalanceRequest;
use App\Http\Resources\ProductStockBalances\ProductStockBalanceResource;
use App\Http\Resources\ApiResponse;
use App\Models\Product;
use Illuminate\Http\JsonResponse;

class ProductStockBalanceController extends Controller
{
    public function upsert(UpsertProductStockBalanceRequest $request, Product $product, UpsertProductStockBalanceAction $action): JsonResponse
    {
        $this->authorize('update', $product);

        return ApiResponse::success(
            new ProductStockBalanceResource($action->execute($this->tenantId(), $product, $request->toDTO())),
            'Stock balance saved successfully'
        );
    }
}
