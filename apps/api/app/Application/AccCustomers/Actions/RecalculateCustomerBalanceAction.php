<?php

namespace App\Application\AccCustomers\Actions;

use App\Domain\AccCustomers\Repositories\AccCustomerBalanceRepositoryInterface;
use App\Domain\AccCustomers\Repositories\AccCustomerTransactionRepositoryInterface;
use App\Models\AccCustomer;
use Illuminate\Support\Facades\DB;

class RecalculateCustomerBalanceAction
{
    public function __construct(
        private AccCustomerBalanceRepositoryInterface $balances,
        private AccCustomerTransactionRepositoryInterface $transactions,
    ) {}

    /**
     * Recompute a customer's remaining balance for a given fiscal year:
     * opening_balance + sum(credit) - sum(debit) across that year's transactions.
     *
     * The balance row is created on demand (with opening_balance defaulting to 0) so that
     * customers with no manually-entered opening balance still track their running balance.
     *
     * Locks the balance row for the duration so concurrent recalculations (e.g. two
     * transactions being recorded at once) can't interleave their read-then-write and drop one.
     *
     * Only touches this one fiscal year — it does NOT cascade into later years. A transaction
     * recorded into a non-active (e.g. past) fiscal year can make later years' opening_balance
     * stale; that's resolved on demand via SyncAccCustomerBalanceAction ("Sync Balance" button),
     * not automatically on every save, so a later year's manually-entered opening_balance is
     * never silently overwritten without the user explicitly asking for it.
     */
    public function execute(AccCustomer $customer, int $fiscalYearId): void
    {
        DB::transaction(function () use ($customer, $fiscalYearId) {
            $balance = $this->balances->lockForRecalculation($customer, $fiscalYearId);

            $net = $this->transactions->netTotal($customer, $fiscalYearId);

            $this->balances->updateRemainingBalance(
                $balance,
                round((float) $balance->opening_balance + $net, 2),
            );
        });
    }
}
