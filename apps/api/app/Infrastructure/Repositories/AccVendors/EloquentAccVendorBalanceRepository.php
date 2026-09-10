<?php

namespace App\Infrastructure\Repositories\AccVendors;

use App\Domain\AccVendors\Repositories\AccVendorBalanceRepositoryInterface;
use App\Models\AccVendor;
use App\Models\AccVendorBalance;

class EloquentAccVendorBalanceRepository implements AccVendorBalanceRepositoryInterface
{
    public function upsert(AccVendor $vendor, int $fiscalYearId, float $openingBalance): AccVendorBalance
    {
        return AccVendorBalance::updateOrCreate(
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

    public function lockForRecalculation(AccVendor $vendor, int $fiscalYearId): AccVendorBalance
    {
        return AccVendorBalance::lockForUpdate()->firstOrCreate([
            'tenant_id'      => $vendor->tenant_id,
            'vendor_id'      => $vendor->id,
            'fiscal_year_id' => $fiscalYearId,
        ]);
    }

    public function updateRemainingBalance(AccVendorBalance $balance, float $remainingBalance): AccVendorBalance
    {
        $balance->update(['remaining_balance' => $remainingBalance]);

        return $balance;
    }
}
