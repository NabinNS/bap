<?php

namespace App\Application\AccCustomers\Actions;

use App\Domain\AccCustomers\Repositories\AccCustomerTransactionRepositoryInterface;
use App\Models\AccCustomer;
use Illuminate\Pagination\LengthAwarePaginator;

class ListAccCustomerTransactionsAction
{
    public function __construct(
        private AccCustomerTransactionRepositoryInterface $transactions,
    ) {}

    public function execute(AccCustomer $customer, int $perPage = 50, ?int $fiscalYearId = null): LengthAwarePaginator
    {
        return $this->transactions->paginate($customer, $perPage, $fiscalYearId);
    }
}
