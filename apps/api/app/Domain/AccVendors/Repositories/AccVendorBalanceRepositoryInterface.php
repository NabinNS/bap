<?php

namespace App\Domain\AccVendors\Repositories;

use App\Models\AccVendor;
use App\Models\AccVendorBalance;

interface AccVendorBalanceRepositoryInterface
{
    public function upsert(AccVendor $vendor, int $fiscalYearId, float $openingBalance): AccVendorBalance;

    /**
     * Fetch (creating on demand) the vendor's balance row for a fiscal year, locked for update
     * so a concurrent recalculation can't interleave its read-then-write.
     */
    public function lockForRecalculation(AccVendor $vendor, int $fiscalYearId): AccVendorBalance;

    public function updateRemainingBalance(AccVendorBalance $balance, float $remainingBalance): AccVendorBalance;
}
