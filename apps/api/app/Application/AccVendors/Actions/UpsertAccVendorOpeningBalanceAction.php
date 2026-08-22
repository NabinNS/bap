<?php

namespace App\Application\AccVendors\Actions;

use App\Domain\AccVendors\Repositories\AccVendorOpeningBalanceRepositoryInterface;
use App\Domain\Settings\Repositories\TenantSettingRepositoryInterface;
use App\Models\AccVendor;
use App\Models\AccVendorOpeningBalance;
use Illuminate\Validation\ValidationException;

class UpsertAccVendorOpeningBalanceAction
{
    public function __construct(
        private AccVendorOpeningBalanceRepositoryInterface $openingBalances,
        private TenantSettingRepositoryInterface $settings,
    ) {}

    public function execute(int $tenantId, AccVendor $vendor, float $openingBalance, ?int $fiscalYearId = null): AccVendorOpeningBalance
    {
        $resolvedFiscalYearId = $fiscalYearId;

        if (!$resolvedFiscalYearId) {
            $settings = $this->settings->getOrCreate($tenantId);
            $resolvedFiscalYearId = $settings->fiscal_year_id;
        }

        if (!$resolvedFiscalYearId) {
            throw ValidationException::withMessages([
                'fiscal_year_id' => ['No active fiscal year set. Please configure it in Settings.'],
            ]);
        }

        return $this->openingBalances->upsert($vendor, $resolvedFiscalYearId, $openingBalance);
    }
}
