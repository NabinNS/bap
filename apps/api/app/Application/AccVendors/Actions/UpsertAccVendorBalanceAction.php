<?php

namespace App\Application\AccVendors\Actions;

use App\Domain\AccVendors\DTOs\AccVendorBalanceData;
use App\Domain\AccVendors\Repositories\AccVendorBalanceRepositoryInterface;
use App\Domain\Settings\Repositories\TenantSettingRepositoryInterface;
use App\Models\AccVendor;
use App\Models\AccVendorBalance;
use Illuminate\Validation\ValidationException;

class UpsertAccVendorBalanceAction
{
    public function __construct(
        private AccVendorBalanceRepositoryInterface $balances,
        private TenantSettingRepositoryInterface $settings,
        private RecalculateVendorBalanceAction $recalculateBalance,
    ) {}

    public function execute(int $tenantId, AccVendor $vendor, AccVendorBalanceData $data): AccVendorBalance
    {
        $fiscalYearId = $data->fiscalYearId ?: $this->settings->getOrCreate($tenantId)->fiscal_year_id;

        if (!$fiscalYearId) {
            throw ValidationException::withMessages([
                'fiscal_year_id' => ['No active fiscal year set. Please configure it in Settings.'],
            ]);
        }

        $balance = $this->balances->upsert($vendor, $fiscalYearId, $data->openingBalance);

        $this->recalculateBalance->execute($vendor, $fiscalYearId);

        return $balance->fresh();
    }
}