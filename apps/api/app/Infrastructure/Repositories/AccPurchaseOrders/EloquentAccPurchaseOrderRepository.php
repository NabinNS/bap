<?php

namespace App\Infrastructure\Repositories\AccPurchaseOrders;

use App\Domain\AccPurchaseOrders\DTOs\AccPurchaseOrderData;
use App\Domain\AccPurchaseOrders\DTOs\AccPurchaseOrderItemData;
use App\Domain\AccPurchaseOrders\Repositories\AccPurchaseOrderRepositoryInterface;
use App\Models\AccPurchaseOrder;
use App\Models\AccPurchaseOrderItem;
use App\Models\AccVendor;
use App\Models\Product;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

class EloquentAccPurchaseOrderRepository implements AccPurchaseOrderRepositoryInterface
{
    public function paginate(AccVendor $vendor, int $perPage, ?int $fiscalYearId = null): LengthAwarePaginator
    {
        return AccPurchaseOrder::where('vendor_id', $vendor->id)
            ->where('tenant_id', $vendor->tenant_id)
            ->when($fiscalYearId, fn ($query) => $query->where('fiscal_year_id', $fiscalYearId))
            ->with(['items.product'])
            ->orderBy('date', 'asc')
            ->paginate($perPage);
    }

    public function paginateAll(int $tenantId, int $perPage, ?int $fiscalYearId = null): LengthAwarePaginator
    {
        return AccPurchaseOrder::where('tenant_id', $tenantId)
            ->when($fiscalYearId, fn ($query) => $query->where('fiscal_year_id', $fiscalYearId))
            ->with(['vendor', 'items.product'])
            ->orderBy('date', 'desc')
            ->paginate($perPage);
    }

    public function trashedAll(int $tenantId, ?int $fiscalYearId = null): Collection
    {
        return AccPurchaseOrder::onlyTrashed()
            ->where('tenant_id', $tenantId)
            ->when($fiscalYearId, fn ($query) => $query->where('fiscal_year_id', $fiscalYearId))
            ->with(['vendor', 'items.product'])
            ->orderBy('deleted_at', 'desc')
            ->get();
    }

    public function trashed(AccVendor $vendor, ?int $fiscalYearId = null): Collection
    {
        return AccPurchaseOrder::onlyTrashed()
            ->where('vendor_id', $vendor->id)
            ->where('tenant_id', $vendor->tenant_id)
            ->when($fiscalYearId, fn ($query) => $query->where('fiscal_year_id', $fiscalYearId))
            ->with(['items.product'])
            ->orderBy('deleted_at', 'desc')
            ->get();
    }

    public function restore(int $tenantId, string $purchaseOrderUlid): AccPurchaseOrder
    {
        $purchaseOrder = AccPurchaseOrder::onlyTrashed()
            ->where('ulid', $purchaseOrderUlid)
            ->where('tenant_id', $tenantId)
            ->firstOrFail();

        $purchaseOrder->restore();

        return $purchaseOrder->fresh();
    }

    public function create(int $tenantId, AccVendor $vendor, int $fiscalYearId, AccPurchaseOrderData $data): AccPurchaseOrder
    {
        return $vendor->purchaseOrders()->create([
            'tenant_id'      => $tenantId,
            'fiscal_year_id' => $fiscalYearId,
            'date'           => $data->date,
            'voucher_no'     => $data->voucherNo,
        ]);
    }

    public function createItem(int $tenantId, AccPurchaseOrder $purchaseOrder, Product $product, AccPurchaseOrderItemData $item): AccPurchaseOrderItem
    {
        return $purchaseOrder->items()->create([
            'tenant_id'  => $tenantId,
            'product_id' => $product->id,
            'quantity'   => $item->quantity,
            'rate'       => $item->rate,
        ]);
    }

    public function update(AccPurchaseOrder $purchaseOrder, AccPurchaseOrderData $data): AccPurchaseOrder
    {
        $purchaseOrder->update([
            'date'       => $data->date,
            'voucher_no' => $data->voucherNo,
        ]);

        return $purchaseOrder->fresh();
    }

    public function delete(AccPurchaseOrder $purchaseOrder): void
    {
        $purchaseOrder->delete();
    }

    public function items(AccPurchaseOrder $purchaseOrder): Collection
    {
        return $purchaseOrder->items()->get();
    }

    public function itemsCount(AccPurchaseOrder $purchaseOrder): int
    {
        return $purchaseOrder->items()->count();
    }

    public function lockItemForUpdate(AccPurchaseOrderItem $item): AccPurchaseOrderItem
    {
        return AccPurchaseOrderItem::lockForUpdate()->findOrFail($item->id);
    }

    public function updateItem(AccPurchaseOrderItem $item, Product $product, AccPurchaseOrderItemData $data): AccPurchaseOrderItem
    {
        $item->update([
            'product_id' => $product->id,
            'quantity'   => $data->quantity,
            'rate'       => $data->rate,
        ]);

        return $item->fresh();
    }

    public function deleteItem(AccPurchaseOrderItem $item): void
    {
        $item->delete();
    }

    public function trashedItems(AccPurchaseOrder $purchaseOrder): Collection
    {
        return AccPurchaseOrderItem::onlyTrashed()
            ->where('purchase_order_id', $purchaseOrder->id)
            ->with(['product', 'purchaseOrder'])
            ->orderBy('deleted_at', 'desc')
            ->get();
    }

    public function restoreItem(int $tenantId, AccPurchaseOrder $purchaseOrder, string $itemUlid): AccPurchaseOrderItem
    {
        $item = AccPurchaseOrderItem::onlyTrashed()
            ->where('ulid', $itemUlid)
            ->where('purchase_order_id', $purchaseOrder->id)
            ->where('tenant_id', $tenantId)
            ->firstOrFail();

        $item->restore();

        return $item->fresh();
    }

    public function deleteItemsForVendorAndProduct(int $tenantId, AccVendor $vendor, Product $product): void
    {
        $purchaseOrderIds = AccPurchaseOrder::where('tenant_id', $tenantId)
            ->where('vendor_id', $vendor->id)
            ->pluck('id');

        $affectedPurchaseOrderIds = AccPurchaseOrderItem::where('tenant_id', $tenantId)
            ->whereIn('purchase_order_id', $purchaseOrderIds)
            ->where('product_id', $product->id)
            ->pluck('purchase_order_id')
            ->unique();

        AccPurchaseOrderItem::where('tenant_id', $tenantId)
            ->whereIn('purchase_order_id', $purchaseOrderIds)
            ->where('product_id', $product->id)
            ->delete();

        AccPurchaseOrder::whereIn('id', $affectedPurchaseOrderIds)
            ->whereDoesntHave('items')
            ->get()
            ->each(fn (AccPurchaseOrder $purchaseOrder) => $purchaseOrder->delete());
    }
}
