<?php

namespace App\Application\AccCustomers\Actions;

use App\Domain\AccCustomers\Repositories\AccCustomerTransactionRepositoryInterface;
use App\Models\AccCustomer;
use App\Models\AccCustomerTransaction;
use Illuminate\Support\Facades\DB;

class DeleteAccCustomerTransactionAction
{
    public function __construct(
        private AccCustomerTransactionRepositoryInterface $transactions,
        private ReverseAccCustomerTransactionItemStockAction $reverseItemStock,
        private RecalculateCustomerBalanceAction $recalculateBalance,
    ) {}

    public function execute(int $tenantId, AccCustomer $customer, AccCustomerTransaction $transaction): void
    {
        DB::transaction(function () use ($tenantId, $customer, $transaction) {
            $fiscalYearId = $transaction->fiscal_year_id;

            foreach ($this->transactions->items($transaction) as $item) {
                $this->reverseItemStock->execute($tenantId, $item);
            }

            $this->transactions->delete($transaction);
            $this->recalculateBalance->execute($customer, $fiscalYearId);
        });
    }
}
