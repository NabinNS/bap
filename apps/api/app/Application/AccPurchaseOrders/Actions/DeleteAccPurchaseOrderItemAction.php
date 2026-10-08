<?php

namespace App\Application\AccPurchaseOrders\Actions;

use App\Domain\AccPurchaseOrders\Repositories\AccPurchaseOrderRepositoryInterface;
use App\Models\AccPurchaseOrder;
use App\Models\AccPurchaseOrderItem;
use Illuminate\Support\Facades\DB;

class DeleteAccPurchaseOrderItemAction
{
    public function __construct(
        private AccPurchaseOrderRepositoryInterface $purchaseOrders,
    ) {}

    /**
     * Deleting the last remaining item leaves an empty purchase order — removes the whole
     * (now-empty) purchase order instead, per product decision (mirrors Quotation).
     */
    public function execute(AccPurchaseOrder $purchaseOrder, AccPurchaseOrderItem $item): void
    {
        DB::transaction(function () use ($purchaseOrder, $item) {
            $item = $this->purchaseOrders->lockItemForUpdate($item);
            $this->purchaseOrders->deleteItem($item);

            if ($this->purchaseOrders->itemsCount($purchaseOrder) === 0) {
                $this->purchaseOrders->delete($purchaseOrder);
            }
        });
    }
}
