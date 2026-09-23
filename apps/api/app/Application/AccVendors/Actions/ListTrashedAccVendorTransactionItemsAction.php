<?php

namespace App\Application\AccVendors\Actions;

use App\Domain\AccVendors\Repositories\AccVendorTransactionRepositoryInterface;
use App\Models\AccVendorTransaction;
use Illuminate\Support\Collection;

class ListTrashedAccVendorTransactionItemsAction
{
    public function __construct(
        private AccVendorTransactionRepositoryInterface $transactions,
    ) {}

    public function execute(AccVendorTransaction $transaction): Collection
    {
        return $this->transactions->trashedItems($transaction);
    }
}
