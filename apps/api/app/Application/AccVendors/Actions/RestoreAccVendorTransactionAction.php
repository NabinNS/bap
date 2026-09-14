<?php

namespace App\Application\AccVendors\Actions;

use App\Domain\AccVendors\Repositories\AccVendorTransactionRepositoryInterface;
use App\Models\AccVendor;
use App\Models\AccVendorTransaction;
use Illuminate\Support\Facades\DB;

class RestoreAccVendorTransactionAction
{
    public function __construct(
        private AccVendorTransactionRepositoryInterface $transactions,
        private RecalculateVendorBalanceAction $recalculateBalance,
    ) {}

    /**
     * Brings the transaction back into the ledger and recalculates the vendor's balance for
     * its fiscal year. Deliberately does NOT re-apply the stock/WACC reversal that deletion
     * performed — undoing that exactly is only safe if nothing else touched the product's
     * stock in between, which restore has no way to verify. Stock must be corrected manually
     * if needed.
     */
    public function execute(int $tenantId, AccVendor $vendor, string $transactionUlid): AccVendorTransaction
    {
        return DB::transaction(function () use ($tenantId, $vendor, $transactionUlid) {
            $transaction = $this->transactions->restore($tenantId, $vendor, $transactionUlid);

            $this->recalculateBalance->execute($vendor, $transaction->fiscal_year_id);

            return $transaction;
        });
    }
}
