<?php

namespace App\Http\Controllers\Api;

use App\Application\ProductTransactionItems\Actions\CreateProductTransactionItemAction;
use App\Application\ProductTransactionItems\Actions\DeleteProductTransactionItemAction;
use App\Application\ProductTransactionItems\Actions\ListProductTransactionItemsAction;
use App\Application\ProductTransactionItems\Actions\ListTrashedProductTransactionItemsAction;
use App\Application\ProductTransactionItems\Actions\RestoreProductTransactionItemAction;
use App\Application\ProductTransactionItems\Actions\UpdateProductTransactionItemAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\ProductTransactionItems\StoreProductTransactionItemRequest;
use App\Http\Requests\ProductTransactionItems\UpdateProductTransactionItemRequest;
use App\Http\Resources\ApiResponse;
use App\Http\Resources\ProductTransactionItems\ProductTransactionItemResource;
use App\Models\Product;
use App\Models\ProductTransactionItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductTransactionItemController extends Controller
{
    public function index(Request $request, Product $product, ListProductTransactionItemsAction $action): JsonResponse
    {
        $this->authorize('view', $product);

        return ApiResponse::paginated(
            $action->execute($product, $request->integer('per_page', 50)),
            ProductTransactionItemResource::class,
            'Transaction items retrieved successfully'
        );
    }

    public function trashed(Product $product, ListTrashedProductTransactionItemsAction $action): JsonResponse
    {
        $this->authorize('view', $product);

        return ApiResponse::success(
            ProductTransactionItemResource::collection($action->execute($product)),
            'Trashed transaction items retrieved successfully'
        );
    }

    public function restore(Product $product, string $itemUlid, RestoreProductTransactionItemAction $action): JsonResponse
    {
        $this->authorize('update', $product);

        $item = $action->execute($this->tenantId(), $product, $itemUlid);

        return ApiResponse::success(new ProductTransactionItemResource($item), 'Transaction item restored successfully');
    }

    public function store(StoreProductTransactionItemRequest $request, Product $product, CreateProductTransactionItemAction $action): JsonResponse
    {
        $this->authorize('update', $product);

        $item = $action->execute($this->tenantId(), $product, $request->toDTO());

        return ApiResponse::success(new ProductTransactionItemResource($item), 'Transaction item recorded successfully', 201);
    }

    public function update(
        UpdateProductTransactionItemRequest $request,
        Product $product,
        ProductTransactionItem $item,
        UpdateProductTransactionItemAction $action
    ): JsonResponse {
        $this->authorize('update', $product);
        abort_unless($item->product_id === $product->id, 404);

        $updated = $action->execute($this->tenantId(), $product, $item, $request->toDTO());

        return ApiResponse::success(new ProductTransactionItemResource($updated), 'Transaction item updated successfully');
    }

    public function destroy(Product $product, ProductTransactionItem $item, DeleteProductTransactionItemAction $action): JsonResponse
    {
        $this->authorize('update', $product);
        abort_unless($item->product_id === $product->id, 404);

        $action->execute($this->tenantId(), $product, $item);

        return ApiResponse::noContent('Transaction item deleted successfully');
    }
}
