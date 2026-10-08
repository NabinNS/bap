<?php

namespace App\Application\AccPurchaseOrders\Actions;

use App\Domain\AccPurchaseOrders\Repositories\AccPurchaseOrderRepositoryInterface;
use App\Models\AccPurchaseOrder;
use Illuminate\Support\Collection;

class ListTrashedAccPurchaseOrderItemsAction
{
    public function __construct(
        private AccPurchaseOrderRepositoryInterface $purchaseOrders,
    ) {}

    public function execute(AccPurchaseOrder $purchaseOrder): Collection
    {
        return $this->purchaseOrders->trashedItems($purchaseOrder);
    }
}
