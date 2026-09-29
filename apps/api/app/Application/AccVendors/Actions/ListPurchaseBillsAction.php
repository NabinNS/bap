<?php

namespace App\Application\AccVendors\Actions;

use App\Domain\AccVendors\Repositories\AccVendorTransactionRepositoryInterface;
use Illuminate\Pagination\LengthAwarePaginator;

class ListPurchaseBillsAction
{
    public function __construct(
        private AccVendorTransactionRepositoryInterface $transactions,
    ) {}

    public function execute(int $tenantId, int $perPage = 50, ?int $fiscalYearId = null): LengthAwarePaginator
    {
        return $this->transactions->paginatePurchaseBills($tenantId, $perPage, $fiscalYearId);
    }
}
