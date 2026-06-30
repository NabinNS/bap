<?php

namespace App\Http\Controllers\Api;

use App\Application\Products\Actions\CreateProductAction;
use App\Application\Products\Actions\DeleteProductAction;
use App\Application\Products\Actions\ListProductsAction;
use App\Application\Products\Actions\UpdateProductAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Products\StoreProductRequest;
use App\Http\Requests\Products\UpdateProductRequest;
use App\Http\Resources\ApiResponse;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function index(Request $request, ListProductsAction $action): JsonResponse
    {
        return ApiResponse::paginated(
            $action->execute($request->user()->currentTenantId(), $request->integer('per_page', 15)),
            'Products retrieved successfully'
        );
    }

    public function store(StoreProductRequest $request, CreateProductAction $action): JsonResponse
    {
        return ApiResponse::created(
            $action->execute($request->user()->currentTenantId(), $request->toDTO()),
            'Product created successfully'
        );
    }

    public function show(Request $request, Product $product): JsonResponse
    {
        $this->authorize('view', $product);

        return ApiResponse::success($product->load('category'), 'Product retrieved successfully');
    }

    public function update(UpdateProductRequest $request, Product $product, UpdateProductAction $action): JsonResponse
    {
        $this->authorize('update', $product);

        return ApiResponse::success(
            $action->execute($product, $request->toDTO()),
            'Product updated successfully'
        );
    }

    public function destroy(Request $request, Product $product, DeleteProductAction $action): JsonResponse
    {
        $this->authorize('delete', $product);

        $action->execute($product);

        return ApiResponse::noContent('Product deleted successfully');
    }
}
