<?php

namespace App\Application\AccCustomers\Actions;

use App\Domain\AccCustomers\Repositories\AccCustomerTransactionRepositoryInterface;
use App\Models\AccCustomerTransaction;
use Illuminate\Support\Collection;

class ListTrashedSalesBillsAction
{
    public function __construct(
        private AccCustomerTransactionRepositoryInterface $transactions,
    ) {}

    /** @return Collection<int, AccCustomerTransaction> */
    public function execute(int $tenantId, ?int $fiscalYearId = null): Collection
    {
        return $this->transactions->trashedSalesBills($tenantId, $fiscalYearId);
    }
}
