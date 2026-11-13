<?php

namespace App\Application\AccCustomers\Actions;

use App\Domain\AccCustomers\Repositories\AccCustomerBalanceRepositoryInterface;
use App\Models\AccCustomer;
use App\Models\AccCustomerBalance;
use Illuminate\Support\Facades\DB;

class SyncAccCustomerBalanceAction
{
    public function __construct(
        private AccCustomerBalanceRepositoryInterface $balances,
        private RecalculateCustomerBalanceAction $recalculateBalance,
    ) {}

    /**
     * Re-sync a customer's balance starting from a given fiscal year, forward through every
     * later year that already tracks this customer — overwriting each later year's
     * opening_balance with the prior year's recalculated remaining_balance. Runs both from
     * the explicit "Sync Balance" button and automatically after every transaction write
     * (see Store/Update/Delete/RestoreAccCustomerTransactionAction etc.), so a later year's
     * balance can never go stale relative to an earlier year's transactions.
     *
     * The starting year's balance row is created on demand (via RecalculateCustomerBalanceAction)
     * if it doesn't exist yet, same as a plain recalculation would.
     */
    public function execute(AccCustomer $customer, int $fiscalYearId): AccCustomerBalance
    {
        return DB::transaction(function () use ($customer, $fiscalYearId) {
            $currentFiscalYearId = $fiscalYearId;

            for ($i = 0; $i < 500; $i++) {
                $this->recalculateBalance->execute($customer, $currentFiscalYearId);
                $current = $this->balances->find($customer, $currentFiscalYearId);

                $next = $this->balances->nextFiscalYearBalance($customer, $currentFiscalYearId);

                if (!$next) {
                    break;
                }

                $this->balances->upsert($customer, $next->fiscal_year_id, (float) $current->remaining_balance);
                $currentFiscalYearId = $next->fiscal_year_id;
            }

            return $this->balances->find($customer, $fiscalYearId);
        });
    }
}
