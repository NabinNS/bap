<?php

namespace App\Application\AccPurchaseOrders\Actions;

use App\Domain\AccPurchaseOrders\Repositories\AccPurchaseOrderRepositoryInterface;
use App\Models\AccVendor;
use Illuminate\Support\Collection;

class ListTrashedAccPurchaseOrdersAction
{
    public function __construct(
        private AccPurchaseOrderRepositoryInterface $purchaseOrders,
    ) {}

    public function execute(AccVendor $vendor, ?int $fiscalYearId = null): Collection
    {
        return $this->purchaseOrders->trashed($vendor, $fiscalYearId);
    }
}
