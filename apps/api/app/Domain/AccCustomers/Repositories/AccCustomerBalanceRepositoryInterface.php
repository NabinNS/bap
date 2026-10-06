<?php

namespace App\Domain\AccCustomers\Repositories;

use App\Models\AccCustomer;
use App\Models\AccCustomerBalance;
use Illuminate\Support\Collection;

interface AccCustomerBalanceRepositoryInterface
{
    public function upsert(AccCustomer $customer, int $fiscalYearId, float $openingBalance): AccCustomerBalance;

    /** All balance rows for a tenant in a fiscal year. */
    public function allForFiscalYear(int $tenantId, int $fiscalYearId): Collection;

    /**
     * Bulk-create/update balance rows for a fiscal year in a single query. Each row is
     * ['customer_id' => int, 'opening_balance' => float, 'remaining_balance' => float].
     */
    public function bulkUpsertForFiscalYear(int $tenantId, int $fiscalYearId, array $rows): void;

    /**
     * Fetch (creating on demand) the customer's balance row for a fiscal year, locked for update
     * so a concurrent recalculation can't interleave its read-then-write.
     */
    public function lockForRecalculation(AccCustomer $customer, int $fiscalYearId): AccCustomerBalance;

    public function updateRemainingBalance(AccCustomerBalance $balance, float $remainingBalance): AccCustomerBalance;
}
