<?php

namespace App\Http\Controllers\Api;

use App\Application\Products\Actions\CreateProductAction;
use App\Application\Products\Actions\DeleteProductAction;
use App\Application\Products\Actions\ListProductsAction;
use App\Application\Products\Actions\ShowProductAction;
use App\Application\Products\Actions\UpdateProductAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Products\StoreProductRequest;
use App\Http\Requests\Products\UpdateProductRequest;
use App\Http\Resources\ApiResponse;
use App\Http\Resources\Products\ProductResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function index(Request $request, ListProductsAction $action): JsonResponse
    {
        return ApiResponse::paginated(
            $action->execute($request->user()->currentTenantId(), $request->integer('per_page', 15)),
            ProductResource::class,
            'Products retrieved successfully'
        );
    }

    public function store(StoreProductRequest $request, CreateProductAction $action): JsonResponse
    {
        return ApiResponse::created(
            new ProductResource($action->execute($request->user()->currentTenantId(), $request->toDTO())),
            'Product created successfully'
        );
    }

    public function show(Request $request, string $ulid, ShowProductAction $action): JsonResponse
    {
        $product = $action->execute($request->user()->currentTenantId(), $ulid);

        $this->authorize('view', $product);

        return ApiResponse::success(new ProductResource($product), 'Product retrieved successfully');
    }

    public function update(UpdateProductRequest $request, string $ulid, UpdateProductAction $action, ShowProductAction $show): JsonResponse
    {
        $product = $show->execute($request->user()->currentTenantId(), $ulid);

        $this->authorize('update', $product);

        return ApiResponse::success(
            new ProductResource($action->execute($product, $request->toDTO())),
            'Product updated successfully'
        );
    }

    public function destroy(Request $request, string $ulid, DeleteProductAction $action, ShowProductAction $show): JsonResponse
    {
        $product = $show->execute($request->user()->currentTenantId(), $ulid);

        $this->authorize('delete', $product);

        $action->execute($product);

        return ApiResponse::noContent('Product deleted successfully');
    }
}
