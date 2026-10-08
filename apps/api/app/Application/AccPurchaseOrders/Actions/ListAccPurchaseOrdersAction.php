<?php

namespace App\Application\AccPurchaseOrders\Actions;

use App\Domain\AccPurchaseOrders\Repositories\AccPurchaseOrderRepositoryInterface;
use App\Models\AccVendor;
use Illuminate\Pagination\LengthAwarePaginator;

class ListAccPurchaseOrdersAction
{
    public function __construct(
        private AccPurchaseOrderRepositoryInterface $purchaseOrders,
    ) {}

    public function execute(AccVendor $vendor, int $perPage = 50, ?int $fiscalYearId = null): LengthAwarePaginator
    {
        return $this->purchaseOrders->paginate($vendor, $perPage, $fiscalYearId);
    }
}
