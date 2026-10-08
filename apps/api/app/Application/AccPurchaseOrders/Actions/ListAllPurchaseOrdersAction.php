<?php

namespace App\Application\AccPurchaseOrders\Actions;

use App\Domain\AccPurchaseOrders\Repositories\AccPurchaseOrderRepositoryInterface;
use Illuminate\Pagination\LengthAwarePaginator;

class ListAllPurchaseOrdersAction
{
    public function __construct(
        private AccPurchaseOrderRepositoryInterface $purchaseOrders,
    ) {}

    public function execute(int $tenantId, int $perPage = 50, ?int $fiscalYearId = null): LengthAwarePaginator
    {
        return $this->purchaseOrders->paginateAll($tenantId, $perPage, $fiscalYearId);
    }
}
