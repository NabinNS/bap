<?php

namespace App\Application\AccVendors\Actions;

use App\Domain\AccVendors\Repositories\AccVendorBalanceRepositoryInterface;
use App\Models\AccVendor;
use App\Models\AccVendorBalance;
use Illuminate\Support\Facades\DB;

class SyncAccVendorBalanceAction
{
    public function __construct(
        private AccVendorBalanceRepositoryInterface $balances,
        private RecalculateVendorBalanceAction $recalculateBalance,
    ) {}

    /**
     * Re-sync a vendor's balance starting from a given fiscal year, forward through every
     * later year that already tracks this vendor — overwriting each later year's
     * opening_balance with the prior year's recalculated remaining_balance. Runs both from
     * the explicit "Sync Balance" button and automatically after every transaction write
     * (see Store/Update/Delete/RestoreAccVendorTransactionAction etc.), so a later year's
     * balance can never go stale relative to an earlier year's transactions.
     *
     * The starting year's balance row is created on demand (via RecalculateVendorBalanceAction)
     * if it doesn't exist yet, same as a plain recalculation would.
     */
    public function execute(AccVendor $vendor, int $fiscalYearId): AccVendorBalance
    {
        return DB::transaction(function () use ($vendor, $fiscalYearId) {
            $currentFiscalYearId = $fiscalYearId;

            for ($i = 0; $i < 500; $i++) {
                $this->recalculateBalance->execute($vendor, $currentFiscalYearId);
                $current = $this->balances->find($vendor, $currentFiscalYearId);

                $next = $this->balances->nextFiscalYearBalance($vendor, $currentFiscalYearId);

                if (!$next) {
                    break;
                }

                $this->balances->upsert($vendor, $next->fiscal_year_id, (float) $current->remaining_balance);
                $currentFiscalYearId = $next->fiscal_year_id;
            }

            return $this->balances->find($vendor, $fiscalYearId);
        });
    }
}
