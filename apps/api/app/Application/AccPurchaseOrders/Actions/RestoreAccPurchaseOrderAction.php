<?php

namespace App\Application\AccPurchaseOrders\Actions;

use App\Domain\AccPurchaseOrders\Repositories\AccPurchaseOrderRepositoryInterface;
use App\Models\AccPurchaseOrder;

class RestoreAccPurchaseOrderAction
{
    public function __construct(
        private AccPurchaseOrderRepositoryInterface $purchaseOrders,
    ) {}

    public function execute(int $tenantId, string $purchaseOrderUlid): AccPurchaseOrder
    {
        return $this->purchaseOrders->restore($tenantId, $purchaseOrderUlid);
    }
}
