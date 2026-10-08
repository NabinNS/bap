<?php

namespace App\Application\AccPurchaseOrders\Actions;

use App\Domain\AccPurchaseOrders\Repositories\AccPurchaseOrderRepositoryInterface;
use App\Models\AccPurchaseOrder;

class DeleteAccPurchaseOrderAction
{
    public function __construct(
        private AccPurchaseOrderRepositoryInterface $purchaseOrders,
    ) {}

    public function execute(AccPurchaseOrder $purchaseOrder): void
    {
        $this->purchaseOrders->delete($purchaseOrder);
    }
}
