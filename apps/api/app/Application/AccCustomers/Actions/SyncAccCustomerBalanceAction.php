<?php

namespace App\Application\AccCustomers\Actions;

use App\Domain\AccCustomers\Repositories\AccCustomerBalanceRepositoryInterface;
use App\Models\AccCustomer;
use App\Models\AccCustomerBalance;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SyncAccCustomerBalanceAction
{
    public function __construct(
        private AccCustomerBalanceRepositoryInterface $balances,
        private RecalculateCustomerBalanceAction $recalculateBalance,
    ) {}

    /**
     * Manually re-sync a customer's balance starting from a given fiscal year, forward through
     * every later year that already tracks this customer — overwriting each later year's
     * opening_balance even if it was entered manually. Only runs when the user explicitly
     * presses "Sync Balance" (unlike RecalculateCustomerBalanceAction, which only ever touches
     * the single fiscal year it's given and never cascades on its own).
     */
    public function execute(AccCustomer $customer, int $fiscalYearId): AccCustomerBalance
    {
        $balance = $this->balances->find($customer, $fiscalYearId);

        if (!$balance) {
            throw ValidationException::withMessages([
                'fiscal_year_id' => ['This customer has no balance recorded for that fiscal year yet.'],
            ]);
        }

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
