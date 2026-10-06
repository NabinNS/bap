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

    public function allForFiscalYear(int $tenantId, int $fiscalYearId): \Illuminate\Support\Collection
    {
        return AccVendorBalance::where('tenant_id', $tenantId)
            ->where('fiscal_year_id', $fiscalYearId)
            ->get();
    }

    public function bulkUpsertForFiscalYear(int $tenantId, int $fiscalYearId, array $rows): void
    {
        if (!$rows) {
            return;
        }

        AccVendorBalance::upsert(
            array_map(fn (array $row) => [
                'tenant_id'         => $tenantId,
                'fiscal_year_id'    => $fiscalYearId,
                'vendor_id'         => $row['vendor_id'],
                'opening_balance'   => $row['opening_balance'],
                'remaining_balance' => $row['remaining_balance'],
            ], $rows),
            ['tenant_id', 'vendor_id', 'fiscal_year_id'],
            ['opening_balance', 'remaining_balance'],
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
