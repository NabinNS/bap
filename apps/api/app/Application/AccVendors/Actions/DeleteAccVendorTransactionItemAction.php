<?php

namespace App\Application\AccVendors\Actions;

use App\Domain\AccVendors\Repositories\AccVendorTransactionRepositoryInterface;
use App\Models\AccVendor;
use App\Models\AccVendorTransaction;
use App\Models\AccVendorTransactionItem;
use Illuminate\Support\Facades\DB;

class DeleteAccVendorTransactionItemAction
{
    public function __construct(
        private AccVendorTransactionRepositoryInterface $transactions,
        private ReverseAccVendorTransactionItemStockAction $reverseItemStock,
        private RecalculateAccVendorTransactionTotalsAction $recalculateTotals,
        private RecalculateVendorBalanceAction $recalculateBalance,
    ) {}

    /**
     * Deleting the last remaining item leaves nothing for the totals recalculation to derive a
     * bill from — removes the whole (now-empty) transaction instead, per product decision.
     */
    public function execute(int $tenantId, AccVendor $vendor, AccVendorTransaction $transaction, AccVendorTransactionItem $item): void
    {
        DB::transaction(function () use ($tenantId, $vendor, $transaction, $item) {
            $item = $this->transactions->lockItemForUpdate($item);

            $this->reverseItemStock->execute($tenantId, $item);

            $fiscalYearId = $transaction->fiscal_year_id;
            $this->transactions->deleteItem($item);

            if ($this->transactions->itemsCount($transaction) === 0) {
                $this->transactions->delete($transaction);
                $this->recalculateBalance->execute($vendor, $fiscalYearId);
                return;
            }

            $this->recalculateTotals->execute($vendor, $transaction);
        });
    }
}
