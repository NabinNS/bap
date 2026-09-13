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

        if (!$settings->fiscal_year_id) {
            throw ValidationException::withMessages([
                'fiscal_year_id' => ['No active fiscal year set. Please configure it in Settings.'],
            ]);
        }

        return DB::transaction(function () use ($tenantId, $vendor, $settings, $data) {
            $transaction = $this->transactions->create($tenantId, $vendor, $settings->fiscal_year_id, $data);

            foreach ($data->items as $item) {
                // Each call already recalculates the vendor balance via RecalculateAccVendorTransactionTotalsAction.
                $this->recordItem->execute($tenantId, $vendor, $transaction, $item);
            }

            if (!$data->items) {
                $this->recalculateBalance->execute($vendor, $settings->fiscal_year_id);
            }

            return $transaction->fresh();
        });
    }
}
