<?php

namespace App\Application\AccCustomers\Actions;

use App\Domain\AccCustomers\Repositories\AccCustomerTransactionRepositoryInterface;
use App\Models\AccCustomer;
use Illuminate\Support\Collection;

class ListTrashedAccCustomerTransactionsAction
{
    public function __construct(
        private AccCustomerTransactionRepositoryInterface $transactions,
    ) {}

    public function execute(AccCustomer $customer, ?int $fiscalYearId = null): Collection
    {
        return $this->transactions->trashed($customer, $fiscalYearId);
    }
}
