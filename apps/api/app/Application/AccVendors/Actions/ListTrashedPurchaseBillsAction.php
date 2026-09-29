<?php

namespace App\Application\AccVendors\Actions;

use App\Domain\AccVendors\Repositories\AccVendorTransactionRepositoryInterface;
use App\Models\AccVendorTransaction;
use Illuminate\Support\Collection;

class ListTrashedPurchaseBillsAction
{
    public function __construct(
        private AccVendorTransactionRepositoryInterface $transactions,
    ) {}

    /** @return Collection<int, AccVendorTransaction> */
    public function execute(int $tenantId, ?int $fiscalYearId = null): Collection
    {
        return $this->transactions->trashedPurchaseBills($tenantId, $fiscalYearId);
    }
}
