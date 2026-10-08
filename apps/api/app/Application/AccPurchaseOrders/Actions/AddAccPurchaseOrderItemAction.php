<?php

namespace App\Application\AccPurchaseOrders\Actions;

use App\Domain\AccPurchaseOrders\DTOs\AccPurchaseOrderItemData;
use App\Domain\AccPurchaseOrders\Repositories\AccPurchaseOrderRepositoryInterface;
use App\Domain\Products\Repositories\ProductRepositoryInterface;
use App\Models\AccPurchaseOrder;
use App\Models\AccPurchaseOrderItem;
use Illuminate\Support\Facades\DB;

class AddAccPurchaseOrderItemAction
{
    public function __construct(
        private AccPurchaseOrderRepositoryInterface $purchaseOrders,
        private ProductRepositoryInterface $products,
    ) {}

    /**
     * Create one purchase order line item — just product + quantity, no stock/ledger impact.
     * A purchase order is only a record of what's intended to be ordered.
     */
    public function execute(int $tenantId, AccPurchaseOrder $purchaseOrder, AccPurchaseOrderItemData $item): AccPurchaseOrderItem
    {
        return DB::transaction(function () use ($tenantId, $purchaseOrder, $item) {
            $product = $this->products->lockByUlid($tenantId, $item->productUlid);

            return $this->purchaseOrders->createItem($tenantId, $purchaseOrder, $product, $item);
        });
    }
}
