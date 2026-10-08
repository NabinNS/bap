<?php

namespace App\Application\AccPurchaseOrders\Actions;

use App\Domain\AccPurchaseOrders\DTOs\AccPurchaseOrderData;
use App\Domain\AccPurchaseOrders\Repositories\AccPurchaseOrderRepositoryInterface;
use App\Models\AccPurchaseOrder;

class UpdateAccPurchaseOrderAction
{
    public function __construct(
        private AccPurchaseOrderRepositoryInterface $purchaseOrders,
    ) {}

    /** Header-fields-only edit (date/voucher_no) — never touches items. */
    public function execute(AccPurchaseOrder $purchaseOrder, AccPurchaseOrderData $data): AccPurchaseOrder
    {
        return $this->purchaseOrders->update($purchaseOrder, $data);
    }
}
