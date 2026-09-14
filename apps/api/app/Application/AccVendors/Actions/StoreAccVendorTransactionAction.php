<?php

namespace App\Application\AccVendors\Actions;

use App\Domain\AccVendors\DTOs\AccVendorTransactionData;
use App\Domain\AccVendors\Repositories\AccVendorTransactionRepositoryInterface;
use App\Domain\Settings\Repositories\TenantSettingRepositoryInterface;
use App\Models\AccVendor;
use App\Models\AccVendorTransaction;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class StoreAccVendorTransactionAction
{
    public function __construct(
        private AccVendorTransactionRepositoryInterface $transactions,
        private TenantSettingRepositoryInterface $settings,
        private RecordAccVendorTransactionItemAction $recordItem,
        private RecalculateVendorBalanceAction $recalculateBalance,
    ) {}

    public function execute(int $tenantId, AccVendor $vendor, AccVendorTransactionData $data): AccVendorTransaction
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

        return DB::transaction(function () use ($tenantId, $vendor, $fiscalYearId, $data) {
            $transaction = $this->transactions->create($tenantId, $vendor, $fiscalYearId, $data);

            foreach ($data->items as $item) {
                // Each call already recalculates the vendor balance via RecalculateAccVendorTransactionTotalsAction.
                $this->recordItem->execute($tenantId, $vendor, $transaction, $item);
            }

            if (!$data->items) {
                $this->recalculateBalance->execute($vendor, $fiscalYearId);
            }

            return $transaction->fresh();
        });
    }
}
