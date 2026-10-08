<?php

namespace App\Application\AccPurchaseOrders\Actions;

use App\Domain\AccPurchaseOrders\Repositories\AccPurchaseOrderRepositoryInterface;
use App\Models\AccPurchaseOrder;
use App\Models\AccPurchaseOrderItem;

class RestoreAccPurchaseOrderItemAction
{
    public function __construct(
        private AccPurchaseOrderRepositoryInterface $purchaseOrders,
    ) {}

    public function execute(int $tenantId, AccPurchaseOrder $purchaseOrder, string $itemUlid): AccPurchaseOrderItem
    {
        return $this->purchaseOrders->restoreItem($tenantId, $purchaseOrder, $itemUlid);
    }
}
