<?php

namespace App\Application\AccVendors\Actions;

use App\Domain\AccVendors\Repositories\AccVendorBalanceRepositoryInterface;
use App\Domain\AccVendors\Repositories\AccVendorTransactionRepositoryInterface;
use App\Models\AccVendor;
use Illuminate\Support\Facades\DB;

class RecalculateVendorBalanceAction
{
    public function __construct(
        private AccVendorBalanceRepositoryInterface $balances,
        private AccVendorTransactionRepositoryInterface $transactions,
    ) {}

    /**
     * Recompute a vendor's remaining balance for a given fiscal year:
     * opening_balance + sum(credit) - sum(debit) across that year's transactions.
     *
     * The balance row is created on demand (with opening_balance defaulting to 0) so that
     * vendors with no manually-entered opening balance still track their running balance.
     *
     * Locks the balance row for the duration so concurrent recalculations (e.g. two
     * transactions being recorded at once) can't interleave their read-then-write and drop one.
     *
     * Only touches this one fiscal year — it does NOT cascade into later years. A transaction
     * recorded into a non-active (e.g. past) fiscal year can make later years' opening_balance
     * stale; that's resolved on demand via SyncAccVendorBalanceAction ("Sync Balance" button),
     * not automatically on every save, so a later year's manually-entered opening_balance is
     * never silently overwritten without the user explicitly asking for it.
     */
    public function execute(AccVendor $vendor, int $fiscalYearId): void
    {
        DB::transaction(function () use ($vendor, $fiscalYearId) {
            $balance = $this->balances->lockForRecalculation($vendor, $fiscalYearId);

            $net = $this->transactions->netTotal($vendor, $fiscalYearId);

            $this->balances->updateRemainingBalance(
                $balance,
                round((float) $balance->opening_balance + $net, 2),
            );
        });
    }
}
