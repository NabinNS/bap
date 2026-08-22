<?php

namespace App\Application\AccVendors\Actions;

use App\Domain\AccVendors\Repositories\AccVendorTransactionRepositoryInterface;
use App\Models\AccVendor;
use Illuminate\Pagination\LengthAwarePaginator;

class ListAccVendorTransactionsAction
{
    public function __construct(
        private AccVendorTransactionRepositoryInterface $transactions,
    ) {}

    public function execute(AccVendor $vendor, int $perPage = 50): LengthAwarePaginator
    {
        return $this->transactions->paginate($vendor, $perPage);
    }
}
