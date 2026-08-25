<?php

namespace App\Http\Controllers\Api;

use App\Application\Products\Actions\CreateProductAction;
use App\Application\Products\Actions\DeleteProductAction;
use App\Application\Products\Actions\ListProductsAction;
use App\Application\Products\Actions\SearchProductsLiteAction;
use App\Application\Products\Actions\ShowProductAction;
use App\Application\Products\Actions\UpdateProductAction;
use App\Domain\Products\DTOs\ProductFilterData;
use App\Http\Controllers\Controller;
use App\Http\Requests\Products\StoreProductRequest;
use App\Http\Requests\Products\UpdateProductRequest;
use App\Http\Resources\ApiResponse;
use App\Http\Resources\Products\ProductLiteResource;
use App\Http\Resources\Products\ProductResource;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;


class ProductController extends Controller
{
    public function index(Request $request, ListProductsAction $action): JsonResponse
    {
        return ApiResponse::paginated(
            $action->execute($this->tenantId(), $request->integer('per_page', 15), ProductFilterData::fromRequest($request)),
            ProductResource::class,
            'Products retrieved successfully'
        );
    }

    public function search(Request $request, SearchProductsLiteAction $action): JsonResponse
    {
        $limit = min($request->integer('per_page', 5), 20);

        return ApiResponse::success(
            ProductLiteResource::collection($action->execute($this->tenantId(), $request->string('search')->toString() ?: null, $limit)),
            'Products retrieved successfully'
        );
    }

    public function store(StoreProductRequest $request, CreateProductAction $action): JsonResponse
    {
        return ApiResponse::created(
            new ProductResource($action->execute($this->tenantId(), $request->toDTO())),
            'Product created successfully'
        );
    }

    public function show(Request $request, string $ulid, ShowProductAction $action): JsonResponse
    {
        return ApiResponse::success(
            new ProductResource($action->execute($this->tenantId(), $ulid)),
            'Product retrieved successfully'
        );
    }

    public function update(UpdateProductRequest $request, Product $product, UpdateProductAction $action): JsonResponse
    {
        $this->authorize('update', $product);

        return ApiResponse::success(
            new ProductResource($action->execute($product, $request->toDTO($product))),
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
