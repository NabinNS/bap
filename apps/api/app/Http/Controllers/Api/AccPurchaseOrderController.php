<?php

namespace App\Http\Controllers\Api;

use App\Application\AccPurchaseOrders\Actions\AddAccPurchaseOrderItemAction;
use App\Application\AccPurchaseOrders\Actions\DeleteAccPurchaseOrderAction;
use App\Application\AccPurchaseOrders\Actions\DeleteAccPurchaseOrderItemAction;
use App\Application\AccPurchaseOrders\Actions\ListAccPurchaseOrdersAction;
use App\Application\AccPurchaseOrders\Actions\ListAllPurchaseOrdersAction;
use App\Application\AccPurchaseOrders\Actions\ListTrashedAccPurchaseOrderItemsAction;
use App\Application\AccPurchaseOrders\Actions\ListTrashedAccPurchaseOrdersAction;
use App\Application\AccPurchaseOrders\Actions\ListTrashedAllPurchaseOrdersAction;
use App\Application\AccPurchaseOrders\Actions\RestoreAccPurchaseOrderAction;
use App\Application\AccPurchaseOrders\Actions\RestoreAccPurchaseOrderItemAction;
use App\Application\AccPurchaseOrders\Actions\StoreAccPurchaseOrderAction;
use App\Application\AccPurchaseOrders\Actions\UpdateAccPurchaseOrderAction;
use App\Application\AccPurchaseOrders\Actions\UpdateAccPurchaseOrderItemAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\AccPurchaseOrders\StoreAccPurchaseOrderItemRequest;
use App\Http\Requests\AccPurchaseOrders\StoreAccPurchaseOrderRequest;
use App\Http\Requests\AccPurchaseOrders\UpdateAccPurchaseOrderRequest;
use App\Http\Resources\AccPurchaseOrders\AccPurchaseOrderItemResource;
use App\Http\Resources\AccPurchaseOrders\AccPurchaseOrderResource;
use App\Http\Resources\ApiResponse;
use App\Models\AccPurchaseOrder;
use App\Models\AccPurchaseOrderItem;
use App\Models\AccVendor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AccPurchaseOrderController extends Controller
{
    public function allPurchaseOrders(Request $request, ListAllPurchaseOrdersAction $action): JsonResponse
    {
        return ApiResponse::paginated(
            $action->execute($this->tenantId(), $request->integer('per_page', 50), $request->integer('fiscal_year_id') ?: null),
            AccPurchaseOrderResource::class,
            'Purchase orders retrieved successfully'
        );
    }

    public function trashedAllPurchaseOrders(Request $request, ListTrashedAllPurchaseOrdersAction $action): JsonResponse
    {
        return ApiResponse::success(
            AccPurchaseOrderResource::collection($action->execute($this->tenantId(), $request->integer('fiscal_year_id') ?: null)),
            'Trashed purchase orders retrieved successfully'
        );
    }

    public function index(Request $request, AccVendor $accVendor, ListAccPurchaseOrdersAction $action): JsonResponse
    {
        $this->authorize('view', $accVendor);

        return ApiResponse::paginated(
            $action->execute($accVendor, $request->integer('per_page', 50), $request->integer('fiscal_year_id') ?: null),
            AccPurchaseOrderResource::class,
            'Purchase orders retrieved successfully'
        );
    }

    public function trashed(Request $request, AccVendor $accVendor, ListTrashedAccPurchaseOrdersAction $action): JsonResponse
    {
        $this->authorize('view', $accVendor);

        return ApiResponse::success(
            AccPurchaseOrderResource::collection($action->execute($accVendor, $request->integer('fiscal_year_id') ?: null)),
            'Trashed purchase orders retrieved successfully'
        );
    }

    public function restore(AccVendor $accVendor, string $purchaseOrderUlid, RestoreAccPurchaseOrderAction $action): JsonResponse
    {
        $this->authorize('update', $accVendor);

        $purchaseOrder = $action->execute($this->tenantId(), $purchaseOrderUlid);

        return ApiResponse::success(new AccPurchaseOrderResource($purchaseOrder), 'Purchase order restored successfully');
    }

    public function store(StoreAccPurchaseOrderRequest $request, AccVendor $accVendor, StoreAccPurchaseOrderAction $action): JsonResponse
    {
        $this->authorize('update', $accVendor);

        $purchaseOrder = $action->execute($this->tenantId(), $accVendor, $request->toDTO());

        return ApiResponse::success(
            new AccPurchaseOrderResource($purchaseOrder),
            'Purchase order created successfully',
            201
        );
    }

    public function storeItem(
        StoreAccPurchaseOrderItemRequest $request,
        AccVendor $accVendor,
        AccPurchaseOrder $purchaseOrder,
        AddAccPurchaseOrderItemAction $action
    ): JsonResponse {
        $this->authorize('update', $accVendor);
        abort_unless($purchaseOrder->vendor_id === $accVendor->id, 404);

        $item = $action->execute($this->tenantId(), $purchaseOrder, $request->toDTO());

        return ApiResponse::success(
            new AccPurchaseOrderItemResource($item),
            'Item recorded successfully',
            201
        );
    }

    public function update(
        UpdateAccPurchaseOrderRequest $request,
        AccVendor $accVendor,
        AccPurchaseOrder $purchaseOrder,
        UpdateAccPurchaseOrderAction $action
    ): JsonResponse {
        $this->authorize('update', $accVendor);
        abort_unless($purchaseOrder->vendor_id === $accVendor->id, 404);

        $updated = $action->execute($purchaseOrder, $request->toDTO());

        return ApiResponse::success(new AccPurchaseOrderResource($updated), 'Purchase order updated successfully');
    }

    public function destroy(
        AccVendor $accVendor,
        AccPurchaseOrder $purchaseOrder,
        DeleteAccPurchaseOrderAction $action
    ): JsonResponse {
        $this->authorize('update', $accVendor);
        abort_unless($purchaseOrder->vendor_id === $accVendor->id, 404);

        $action->execute($purchaseOrder);

        return ApiResponse::noContent('Purchase order deleted successfully');
    }

    public function updateItem(
        StoreAccPurchaseOrderItemRequest $request,
        AccVendor $accVendor,
        AccPurchaseOrder $purchaseOrder,
        AccPurchaseOrderItem $item,
        UpdateAccPurchaseOrderItemAction $action
    ): JsonResponse {
        $this->authorize('update', $accVendor);
        abort_unless($purchaseOrder->vendor_id === $accVendor->id, 404);
        abort_unless($item->purchase_order_id === $purchaseOrder->id, 404);

        $updated = $action->execute($this->tenantId(), $purchaseOrder, $item, $request->toDTO());

        return ApiResponse::success(new AccPurchaseOrderItemResource($updated), 'Item updated successfully');
    }

    public function destroyItem(
        AccVendor $accVendor,
        AccPurchaseOrder $purchaseOrder,
        AccPurchaseOrderItem $item,
        DeleteAccPurchaseOrderItemAction $action
    ): JsonResponse {
        $this->authorize('update', $accVendor);
        abort_unless($purchaseOrder->vendor_id === $accVendor->id, 404);
        abort_unless($item->purchase_order_id === $purchaseOrder->id, 404);

        $action->execute($purchaseOrder, $item);

        return ApiResponse::noContent('Item deleted successfully');
    }

    public function trashedItems(
        AccVendor $accVendor,
        AccPurchaseOrder $purchaseOrder,
        ListTrashedAccPurchaseOrderItemsAction $action
    ): JsonResponse {
        $this->authorize('view', $accVendor);
        abort_unless($purchaseOrder->vendor_id === $accVendor->id, 404);

        return ApiResponse::success(
            AccPurchaseOrderItemResource::collection($action->execute($purchaseOrder)),
            'Trashed items retrieved successfully'
        );
    }

    public function restoreItem(
        AccVendor $accVendor,
        AccPurchaseOrder $purchaseOrder,
        string $itemUlid,
        RestoreAccPurchaseOrderItemAction $action
    ): JsonResponse {
        $this->authorize('update', $accVendor);
        abort_unless($purchaseOrder->vendor_id === $accVendor->id, 404);

        $item = $action->execute($this->tenantId(), $purchaseOrder, $itemUlid);

        return ApiResponse::success(new AccPurchaseOrderItemResource($item), 'Item restored successfully');
    }
}
