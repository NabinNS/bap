<?php

namespace App\Domain\AccVendors\Repositories;

use App\Models\AccVendor;
use App\Models\AccVendorBalance;
use Illuminate\Support\Collection;

interface AccVendorBalanceRepositoryInterface
{
    public function upsert(AccVendor $vendor, int $fiscalYearId, float $openingBalance): AccVendorBalance;

    /** All balance rows for a tenant in a fiscal year. */
    public function allForFiscalYear(int $tenantId, int $fiscalYearId): Collection;

    /**
     * Bulk-create/update balance rows for a fiscal year in a single query. Each row is
     * ['vendor_id' => int, 'opening_balance' => float, 'remaining_balance' => float].
     */
    public function bulkUpsertForFiscalYear(int $tenantId, int $fiscalYearId, array $rows): void;

    /**
     * Fetch (creating on demand) the vendor's balance row for a fiscal year, locked for update
     * so a concurrent recalculation can't interleave its read-then-write.
     */
    public function lockForRecalculation(AccVendor $vendor, int $fiscalYearId): AccVendorBalance;

    public function updateRemainingBalance(AccVendorBalance $balance, float $remainingBalance): AccVendorBalance;

    /**
     * The vendor's balance row for the next fiscal year after the given one (by sort_order),
     * if a row already exists there — used to cascade a balance change forward into a later
     * year that already tracks this vendor.
     */
    public function nextFiscalYearBalance(AccVendor $vendor, int $fiscalYearId): ?AccVendorBalance;

    /** The vendor's balance row for a fiscal year, if one exists (no implicit create). */
    public function find(AccVendor $vendor, int $fiscalYearId): ?AccVendorBalance;
}
