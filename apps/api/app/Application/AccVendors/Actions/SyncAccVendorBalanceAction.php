<?php

namespace App\Application\AccVendors\Actions;

use App\Domain\AccVendors\Repositories\AccVendorBalanceRepositoryInterface;
use App\Models\AccVendor;
use App\Models\AccVendorBalance;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SyncAccVendorBalanceAction
{
    public function __construct(
        private AccVendorBalanceRepositoryInterface $balances,
        private RecalculateVendorBalanceAction $recalculateBalance,
    ) {}

    /**
     * Manually re-sync a vendor's balance starting from a given fiscal year, forward through
     * every later year that already tracks this vendor — overwriting each later year's
     * opening_balance even if it was entered manually. Only runs when the user explicitly
     * presses "Sync Balance" (unlike RecalculateVendorBalanceAction, which only ever touches
     * the single fiscal year it's given and never cascades on its own).
     */
    public function execute(AccVendor $vendor, int $fiscalYearId): AccVendorBalance
    {
        $balance = $this->balances->find($vendor, $fiscalYearId);

        if (!$balance) {
            throw ValidationException::withMessages([
                'fiscal_year_id' => ['This vendor has no balance recorded for that fiscal year yet.'],
            ]);
        }

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
