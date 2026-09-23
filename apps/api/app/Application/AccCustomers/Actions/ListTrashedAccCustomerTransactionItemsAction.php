<?php

namespace App\Application\AccCustomers\Actions;

use App\Domain\AccCustomers\Repositories\AccCustomerTransactionRepositoryInterface;
use App\Models\AccCustomerTransaction;
use Illuminate\Support\Collection;

class ListTrashedAccCustomerTransactionItemsAction
{
    public function __construct(
        private AccCustomerTransactionRepositoryInterface $transactions,
    ) {}

    public function execute(AccCustomerTransaction $transaction): Collection
    {
        return $this->transactions->trashedItems($transaction);
    }
}
