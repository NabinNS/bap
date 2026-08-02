<?php

namespace App\Http\Controllers\Api;

use App\Application\Products\Actions\CreateProductDiscountAction;
use App\Application\Products\Actions\DeleteProductDiscountAction;
use App\Application\Products\Actions\ListProductDiscountsAction;
use App\Application\Products\Actions\UpdateProductDiscountAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Products\StoreProductDiscountRequest;
use App\Http\Requests\Products\UpdateProductDiscountRequest;
use App\Http\Resources\ApiResponse;
use App\Http\Resources\Products\ProductDiscountResource;
use App\Models\Product;
use App\Models\ProductDiscount;
use Illuminate\Http\JsonResponse;

class ProductDiscountController extends Controller
{
    public function index(Product $product, ListProductDiscountsAction $action): JsonResponse
    {
        $this->authorize('view', $product);

        return ApiResponse::success(
            ProductDiscountResource::collection($action->execute($product)),
            'Discounts retrieved successfully'
        );
    }

    public function store(StoreProductDiscountRequest $request, Product $product, CreateProductDiscountAction $action): JsonResponse
    {
        $this->authorize('update', $product);

        return ApiResponse::created(
            new ProductDiscountResource($action->execute($product, $request->toDTO())),
            'Discount created successfully'
        );
    }

    public function update(UpdateProductDiscountRequest $request, Product $product, ProductDiscount $discount, UpdateProductDiscountAction $action): JsonResponse
    {
        $this->authorize('update', $product);

        return ApiResponse::success(
            new ProductDiscountResource($action->execute($discount, $request->toDTO($discount))),
            'Discount updated successfully'
        );
    }

    public function destroy(Product $product, ProductDiscount $discount, DeleteProductDiscountAction $action): JsonResponse
    {
        $this->authorize('update', $product);

        $action->execute($discount);

        return ApiResponse::noContent('Discount deleted successfully');
    }
}
