<?php

namespace App\Domain\AccPurchaseOrders\Repositories;

use App\Domain\AccPurchaseOrders\DTOs\AccPurchaseOrderData;
use App\Domain\AccPurchaseOrders\DTOs\AccPurchaseOrderItemData;
use App\Models\AccPurchaseOrder;
use App\Models\AccPurchaseOrderItem;
use App\Models\AccVendor;
use App\Models\Product;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

interface AccPurchaseOrderRepositoryInterface
{
    public function paginate(AccVendor $vendor, int $perPage, ?int $fiscalYearId = null): LengthAwarePaginator;

    /**
     * All purchase orders across every vendor in the tenant, for the "Billing > Purchase Order"
     * screen's list.
     */
    public function paginateAll(int $tenantId, int $perPage, ?int $fiscalYearId = null): LengthAwarePaginator;

    /** @return Collection<int, AccPurchaseOrder> */
    public function trashedAll(int $tenantId, ?int $fiscalYearId = null): Collection;

    /** @return Collection<int, AccPurchaseOrder> */
    public function trashed(AccVendor $vendor, ?int $fiscalYearId = null): Collection;

    /**
     * Restore a soft-deleted purchase order by ulid (implicit route-model-binding can't resolve
     * a trashed row, so this looks it up explicitly rather than taking a bound model).
     */
    public function restore(int $tenantId, string $purchaseOrderUlid): AccPurchaseOrder;

    public function create(int $tenantId, AccVendor $vendor, int $fiscalYearId, AccPurchaseOrderData $data): AccPurchaseOrder;

    public function createItem(int $tenantId, AccPurchaseOrder $purchaseOrder, Product $product, AccPurchaseOrderItemData $item): AccPurchaseOrderItem;

    /** Header fields only (date/voucher_no) — never touches items. */
    public function update(AccPurchaseOrder $purchaseOrder, AccPurchaseOrderData $data): AccPurchaseOrder;

    public function delete(AccPurchaseOrder $purchaseOrder): void;

    /** @return Collection<int, AccPurchaseOrderItem> */
    public function items(AccPurchaseOrder $purchaseOrder): Collection;

    public function itemsCount(AccPurchaseOrder $purchaseOrder): int;

    public function lockItemForUpdate(AccPurchaseOrderItem $item): AccPurchaseOrderItem;

    public function updateItem(AccPurchaseOrderItem $item, Product $product, AccPurchaseOrderItemData $data): AccPurchaseOrderItem;

    public function deleteItem(AccPurchaseOrderItem $item): void;

    /** @return Collection<int, AccPurchaseOrderItem> */
    public function trashedItems(AccPurchaseOrder $purchaseOrder): Collection;

    /**
     * Restore a soft-deleted item by ulid (implicit route-model-binding can't resolve a
     * trashed row, so this looks it up explicitly rather than taking a bound model).
     */
    public function restoreItem(int $tenantId, AccPurchaseOrder $purchaseOrder, string $itemUlid): AccPurchaseOrderItem;

    /**
     * Removes every open purchase-order line item for this vendor+product (and the purchase
     * order itself, if that was its last item) — used when a bill for that vendor/product is
     * recorded, since the order is now fulfilled.
     */
    public function deleteItemsForVendorAndProduct(int $tenantId, AccVendor $vendor, Product $product): void;
}
