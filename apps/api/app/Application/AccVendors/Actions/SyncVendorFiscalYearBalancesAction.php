<?php

namespace App\Application\AccVendors\Actions;

use App\Domain\AccVendors\Repositories\AccVendorBalanceRepositoryInterface;
use App\Domain\AccVendors\Repositories\AccVendorRepositoryInterface;
use App\Domain\AccVendors\Repositories\AccVendorTransactionRepositoryInterface;

class SyncVendorFiscalYearBalancesAction
{
    public function __construct(
        private AccVendorBalanceRepositoryInterface $balances,
        private AccVendorTransactionRepositoryInterface $transactions,
        private AccVendorRepositoryInterface $vendors,
        private RecalculateVendorBalanceAction $recalculateBalance,
    ) {}

    /**
     * Carry each vendor's remaining_balance from the source fiscal year into the target
     * fiscal year's opening_balance.
     *
     * A vendor is skipped if the target year already has a balance row for them with a
     * non-zero opening_balance or any transaction recorded — either means a human (or an
     * earlier sync) already established that year's balance and it must not be overwritten.
     *
     * Which vendors need syncing is decided with a handful of bulk queries (not one query
     * per vendor), so this stays fast for tenants with thousands of vendors. Only the
     * vendors that actually need a new opening_balance are then recalculated individually
     * via the shared, lock-protected RecalculateVendorBalanceAction — this is normally a
     * small subset (new vendors since the last sync), and keeps the remaining_balance
     * formula in one place instead of duplicating it here.
     *
     * Returns the number of vendors synced.
     */
    public function execute(int $tenantId, int $fromFiscalYearId, int $toFiscalYearId): int
    {
        $sourceBalances = $this->balances->allForFiscalYear($tenantId, $fromFiscalYearId);

        if ($sourceBalances->isEmpty()) {
            return 0;
        }

        $targetBalances = $this->balances->allForFiscalYear($tenantId, $toFiscalYearId)->keyBy('vendor_id');
        $targetNetTotals = $this->transactions->netTotalsForFiscalYear($tenantId, $toFiscalYearId);

        $rows = [];

        foreach ($sourceBalances as $sourceBalance) {
            $vendorId = $sourceBalance->vendor_id;
            $target = $targetBalances->get($vendorId);
            $hasTransactions = array_key_exists($vendorId, $targetNetTotals);

            if ($target && ((float) $target->opening_balance !== 0.0 || $hasTransactions)) {
                continue;
            }

            $opening = (float) $sourceBalance->remaining_balance;

            $rows[] = [
                'vendor_id'         => $vendorId,
                'opening_balance'   => $opening,
                'remaining_balance' => $opening,
            ];
        }

        if (!$rows) {
            return 0;
        }

        $this->balances->bulkUpsertForFiscalYear($tenantId, $toFiscalYearId, $rows);

        $syncedVendors = $this->vendors->findByIds($tenantId, array_column($rows, 'vendor_id'));
        foreach ($syncedVendors as $vendor) {
            $this->recalculateBalance->execute($vendor, $toFiscalYearId);
        }

        return count($rows);
    }
}
