<?php

namespace App\Application\AccVendors\Actions;

use App\Domain\AccVendors\Repositories\AccVendorTransactionRepositoryInterface;
use App\Models\AccVendor;
use App\Models\AccVendorTransaction;
use Illuminate\Support\Facades\DB;

class DeleteAccVendorTransactionAction
{
    public function __construct(
        private AccVendorTransactionRepositoryInterface $transactions,
        private ReverseAccVendorTransactionItemStockAction $reverseItemStock,
        private RecalculateVendorBalanceAction $recalculateBalance,
    ) {}

    public function execute(int $tenantId, AccVendor $vendor, AccVendorTransaction $transaction): void
    {
        DB::transaction(function () use ($tenantId, $vendor, $transaction) {
            $fiscalYearId = $transaction->fiscal_year_id;

            foreach ($this->transactions->items($transaction) as $item) {
                $this->reverseItemStock->execute($tenantId, $item);
            }

            $this->transactions->delete($transaction);
            $this->recalculateBalance->execute($vendor, $fiscalYearId);
        });
    }
}
