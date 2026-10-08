<?php

namespace App\Application\AccPurchaseOrders\Actions;

use App\Domain\AccPurchaseOrders\Repositories\AccPurchaseOrderRepositoryInterface;
use App\Models\AccPurchaseOrder;
use Illuminate\Support\Collection;

class ListTrashedAllPurchaseOrdersAction
{
    public function __construct(
        private AccPurchaseOrderRepositoryInterface $purchaseOrders,
    ) {}

    /** @return Collection<int, AccPurchaseOrder> */
    public function execute(int $tenantId, ?int $fiscalYearId = null): Collection
    {
        return $this->purchaseOrders->trashedAll($tenantId, $fiscalYearId);
    }
}
