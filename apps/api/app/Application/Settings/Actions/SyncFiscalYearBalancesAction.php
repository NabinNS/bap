<?php

namespace App\Application\Settings\Actions;

use App\Application\AccCustomers\Actions\SyncCustomerFiscalYearBalancesAction;
use App\Application\AccVendors\Actions\SyncVendorFiscalYearBalancesAction;
use App\Application\ProductStockBalances\Actions\SyncProductFiscalYearStockBalancesAction;
use App\Domain\Settings\DTOs\SyncFiscalYearBalancesResult;
use App\Domain\Settings\DTOs\TenantSettingData;
use App\Domain\Settings\Repositories\TenantSettingRepositoryInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SyncFiscalYearBalancesAction
{
    public function __construct(
        private TenantSettingRepositoryInterface $settings,
        private SyncCustomerFiscalYearBalancesAction $syncCustomers,
        private SyncVendorFiscalYearBalancesAction $syncVendors,
        private SyncProductFiscalYearStockBalancesAction $syncProducts,
    ) {}

    /**
     * Carry forward customer/vendor balances from the tenant's current active fiscal year
     * into the target fiscal year. Safe to call repeatedly — rows that already have a
     * balance established (manually or by an earlier sync) are left untouched.
     */
    public function execute(int $tenantId, int $toFiscalYearId): SyncFiscalYearBalancesResult
    {
        $fromFiscalYearId = $this->settings->getOrCreate($tenantId)->fiscal_year_id;

        if (!$fromFiscalYearId) {
            throw ValidationException::withMessages([
                'fiscal_year_id' => ['No active fiscal year set. Please configure it in Settings.'],
            ]);
        }

        if ($fromFiscalYearId === $toFiscalYearId) {
            throw ValidationException::withMessages([
                'to_fiscal_year_id' => ['Target fiscal year must be different from the currently active one.'],
            ]);
        }

        return DB::transaction(function () use ($tenantId, $fromFiscalYearId, $toFiscalYearId) {
            $customersSynced = $this->syncCustomers->execute($tenantId, $fromFiscalYearId, $toFiscalYearId);
            $vendorsSynced = $this->syncVendors->execute($tenantId, $fromFiscalYearId, $toFiscalYearId);
            $productsSynced = $this->syncProducts->execute($tenantId, $fromFiscalYearId, $toFiscalYearId);

            // Syncing is meaningless unless the tenant is actually moving to the target year,
            // so the sync action also switches the active fiscal year pointer.
            $setting = $this->settings->getOrCreate($tenantId);
            $this->settings->update(
                $setting,
                new TenantSettingData(fiscalYearId: $toFiscalYearId, meta: $setting->meta),
            );

            return new SyncFiscalYearBalancesResult($customersSynced, $vendorsSynced, $productsSynced);
        });
    }
}
