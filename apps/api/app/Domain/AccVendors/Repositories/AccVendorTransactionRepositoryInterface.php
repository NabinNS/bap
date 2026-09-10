<?php

namespace App\Domain\AccVendors\Repositories;

use App\Models\AccVendor;
use Illuminate\Pagination\LengthAwarePaginator;

interface AccVendorTransactionRepositoryInterface
{
    public function paginate(AccVendor $vendor, int $perPage): LengthAwarePaginator;

    /**
     * Net total (credit - debit) across a vendor's transactions for a fiscal year.
     */
    public function netTotal(AccVendor $vendor, int $fiscalYearId): float;
}
