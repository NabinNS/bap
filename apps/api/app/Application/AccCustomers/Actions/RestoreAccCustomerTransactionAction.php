<?php

namespace App\Application\AccCustomers\Actions;

use App\Domain\AccCustomers\Repositories\AccCustomerTransactionRepositoryInterface;
use App\Models\AccCustomer;
use App\Models\AccCustomerTransaction;
use Illuminate\Support\Facades\DB;

class RestoreAccCustomerTransactionAction
{
    public function __construct(
        private AccCustomerTransactionRepositoryInterface $transactions,
        private RecalculateCustomerBalanceAction $recalculateBalance,
    ) {}

    /**
     * Brings the transaction back into the ledger and recalculates the customer's balance for
     * its fiscal year. Deliberately does NOT re-apply the stock reversal that deletion
     * performed — undoing that exactly is only safe if nothing else touched the product's
     * stock in between, which restore has no way to verify. Stock must be corrected manually
     * if needed.
     */
    public function execute(int $tenantId, AccCustomer $customer, string $transactionUlid): AccCustomerTransaction
    {
        return DB::transaction(function () use ($tenantId, $customer, $transactionUlid) {
            $transaction = $this->transactions->restore($tenantId, $customer, $transactionUlid);

            $this->recalculateBalance->execute($customer, $transaction->fiscal_year_id);

            return $transaction;
        });
    }
}
