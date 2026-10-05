<?php

namespace App\Application\AccCustomers\Actions;

use App\Domain\AccCustomers\Repositories\AccCustomerTransactionRepositoryInterface;
use Illuminate\Pagination\LengthAwarePaginator;

class ListSalesBillsAction
{
    public function __construct(
        private AccCustomerTransactionRepositoryInterface $transactions,
    ) {}

    public function execute(int $tenantId, int $perPage = 50, ?int $fiscalYearId = null): LengthAwarePaginator
    {
        return $this->transactions->paginateSalesBills($tenantId, $perPage, $fiscalYearId);
    }
}
