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

    public function execute(int $tenantId, AccVendor $vendor, float $openingBalance): AccVendorOpeningBalance
    {
        $settings = $this->settings->getOrCreate($tenantId);

        if (!$settings->fiscal_year_id) {
            throw ValidationException::withMessages([
                'fiscal_year_id' => ['No active fiscal year set. Please configure it in Settings.'],
            ]);
        }

        return $this->openingBalances->upsert($vendor, $settings->fiscal_year_id, $openingBalance);
    }
}
