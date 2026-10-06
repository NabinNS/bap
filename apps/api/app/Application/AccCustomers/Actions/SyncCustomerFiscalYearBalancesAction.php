<?php

namespace App\Application\AccCustomers\Actions;

use App\Domain\AccCustomers\Repositories\AccCustomerBalanceRepositoryInterface;
use App\Domain\AccCustomers\Repositories\AccCustomerRepositoryInterface;
use App\Domain\AccCustomers\Repositories\AccCustomerTransactionRepositoryInterface;

class SyncCustomerFiscalYearBalancesAction
{
    public function __construct(
        private AccCustomerBalanceRepositoryInterface $balances,
        private AccCustomerTransactionRepositoryInterface $transactions,
        private AccCustomerRepositoryInterface $customers,
        private RecalculateCustomerBalanceAction $recalculateBalance,
    ) {}

    /**
     * Carry each customer's remaining_balance from the source fiscal year into the target
     * fiscal year's opening_balance.
     *
     * A customer is skipped if the target year already has a balance row for them with a
     * non-zero opening_balance or any transaction recorded — either means a human (or an
     * earlier sync) already established that year's balance and it must not be overwritten.
     *
     * Which customers need syncing is decided with a handful of bulk queries (not one query
     * per customer), so this stays fast for tenants with thousands of customers. Only the
     * customers that actually need a new opening_balance are then recalculated individually
     * via the shared, lock-protected RecalculateCustomerBalanceAction — this is normally a
     * small subset (new customers since the last sync), and keeps the remaining_balance
     * formula in one place instead of duplicating it here.
     *
     * Returns the number of customers synced.
     */
    public function execute(int $tenantId, int $fromFiscalYearId, int $toFiscalYearId): int
    {
        $sourceBalances = $this->balances->allForFiscalYear($tenantId, $fromFiscalYearId);

        if ($sourceBalances->isEmpty()) {
            return 0;
        }

        $targetBalances = $this->balances->allForFiscalYear($tenantId, $toFiscalYearId)->keyBy('customer_id');
        $targetNetTotals = $this->transactions->netTotalsForFiscalYear($tenantId, $toFiscalYearId);

        $rows = [];

        foreach ($sourceBalances as $sourceBalance) {
            $customerId = $sourceBalance->customer_id;
            $target = $targetBalances->get($customerId);
            $hasTransactions = array_key_exists($customerId, $targetNetTotals);

            if ($target && ((float) $target->opening_balance !== 0.0 || $hasTransactions)) {
                continue;
            }

            $opening = (float) $sourceBalance->remaining_balance;

            $rows[] = [
                'customer_id'       => $customerId,
                'opening_balance'   => $opening,
                'remaining_balance' => $opening,
            ];
        }

        if (!$rows) {
            return 0;
        }

        $this->balances->bulkUpsertForFiscalYear($tenantId, $toFiscalYearId, $rows);

        $syncedCustomers = $this->customers->findByIds($tenantId, array_column($rows, 'customer_id'));
        foreach ($syncedCustomers as $customer) {
            $this->recalculateBalance->execute($customer, $toFiscalYearId);
        }

        return count($rows);
    }
}
