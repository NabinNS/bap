<?php

namespace App\Application\AccVendors\Actions;

use App\Domain\AccVendors\Repositories\AccVendorTransactionRepositoryInterface;
use App\Models\AccVendor;
use Illuminate\Support\Collection;

class ListTrashedAccVendorTransactionsAction
{
    public function __construct(
        private AccVendorTransactionRepositoryInterface $transactions,
    ) {}

    public function execute(AccVendor $vendor, ?int $fiscalYearId = null): Collection
    {
        return $this->transactions->trashed($vendor, $fiscalYearId);
    }
}
