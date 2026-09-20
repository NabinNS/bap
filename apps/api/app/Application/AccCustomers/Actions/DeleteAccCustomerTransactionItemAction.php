<?php

namespace App\Application\AccCustomers\Actions;

use App\Domain\AccCustomers\Repositories\AccCustomerTransactionRepositoryInterface;
use App\Models\AccCustomer;
use App\Models\AccCustomerTransaction;
use App\Models\AccCustomerTransactionItem;
use Illuminate\Support\Facades\DB;

class DeleteAccCustomerTransactionItemAction
{
    public function __construct(
        private AccCustomerTransactionRepositoryInterface $transactions,
        private ReverseAccCustomerTransactionItemStockAction $reverseItemStock,
        private RecalculateAccCustomerTransactionTotalsAction $recalculateTotals,
        private RecalculateCustomerBalanceAction $recalculateBalance,
    ) {}

    /**
     * Deleting the last remaining item leaves nothing for the totals recalculation to derive a
     * bill from — removes the whole (now-empty) transaction instead, per product decision.
     */
    public function execute(int $tenantId, AccCustomer $customer, AccCustomerTransaction $transaction, AccCustomerTransactionItem $item): void
    {
        DB::transaction(function () use ($tenantId, $customer, $transaction, $item) {
            $item = $this->transactions->lockItemForUpdate($item);

            $this->reverseItemStock->execute($tenantId, $item);

            $fiscalYearId = $transaction->fiscal_year_id;
            $this->transactions->deleteItem($item);

            if ($this->transactions->itemsCount($transaction) === 0) {
                $this->transactions->delete($transaction);
                $this->recalculateBalance->execute($customer, $fiscalYearId);
                return;
            }

            $this->recalculateTotals->execute($customer, $transaction);
        });
    }
}
