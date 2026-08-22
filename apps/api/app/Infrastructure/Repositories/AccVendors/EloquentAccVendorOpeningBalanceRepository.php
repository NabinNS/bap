<?php

namespace App\Infrastructure\Repositories\AccVendors;

use App\Domain\AccVendors\Repositories\AccVendorOpeningBalanceRepositoryInterface;
use App\Models\AccVendor;
use App\Models\AccVendorOpeningBalance;

class EloquentAccVendorOpeningBalanceRepository implements AccVendorOpeningBalanceRepositoryInterface
{
    public function upsert(AccVendor $vendor, int $fiscalYearId, float $openingBalance): AccVendorOpeningBalance
    {
        return AccVendorOpeningBalance::updateOrCreate(
            [
                'tenant_id'      => $vendor->tenant_id,
                'vendor_id'      => $vendor->id,
                'fiscal_year_id' => $fiscalYearId,
            ],
            [
                'opening_balance' => $openingBalance,
            ]
        );
    }
}
