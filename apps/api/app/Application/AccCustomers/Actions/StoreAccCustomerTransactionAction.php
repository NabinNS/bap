<?php

namespace App\Application\AccCustomers\Actions;

use App\Domain\AccCustomers\DTOs\AccCustomerTransactionData;
use App\Domain\AccCustomers\Repositories\AccCustomerTransactionRepositoryInterface;
use App\Domain\Settings\Repositories\TenantSettingRepositoryInterface;
use App\Models\AccCustomer;
use App\Models\AccCustomerTransaction;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class StoreAccCustomerTransactionAction
{
    public function __construct(
        private AccCustomerTransactionRepositoryInterface $transactions,
        private TenantSettingRepositoryInterface $settings,
        private RecordAccCustomerTransactionItemAction $recordItem,
        private RecalculateCustomerBalanceAction $recalculateBalance,
    ) {}

    public function execute(int $tenantId, AccCustomer $customer, AccCustomerTransactionData $data): AccCustomerTransaction
    {
        $settings = $this->settings->getOrCreate($tenantId);

        // Defaults to the tenant's active fiscal year; the caller may target a different
        // (e.g. past) one explicitly, since the fiscal year picker on the entry forms lets
        // the user pick which year's ledger this transaction should belong to.
        $fiscalYearId = $data->fiscalYearId ?? $settings->fiscal_year_id;

        if (!$fiscalYearId) {
            throw ValidationException::withMessages([
                'fiscal_year_id' => ['No active fiscal year set. Please configure it in Settings.'],
            ]);
        }

        return DB::transaction(function () use ($tenantId, $customer, $fiscalYearId, $data) {
            $transaction = $this->transactions->create($tenantId, $customer, $fiscalYearId, $data);

            foreach ($data->items as $item) {
                // Each call already recalculates the customer balance via RecalculateAccCustomerTransactionTotalsAction.
                $this->recordItem->execute($tenantId, $customer, $transaction, $item);
            }

            if (!$data->items) {
                $this->recalculateBalance->execute($customer, $fiscalYearId);
            }

            return $transaction->fresh();
        });
    }
}
