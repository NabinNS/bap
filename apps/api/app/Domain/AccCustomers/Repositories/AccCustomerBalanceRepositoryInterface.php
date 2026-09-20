<?php

namespace App\Domain\AccCustomers\Repositories;

use App\Models\AccCustomer;
use App\Models\AccCustomerBalance;

interface AccCustomerBalanceRepositoryInterface
{
    public function upsert(AccCustomer $customer, int $fiscalYearId, float $openingBalance): AccCustomerBalance;

    /**
     * Fetch (creating on demand) the customer's balance row for a fiscal year, locked for update
     * so a concurrent recalculation can't interleave its read-then-write.
     */
    public function lockForRecalculation(AccCustomer $customer, int $fiscalYearId): AccCustomerBalance;

    public function updateRemainingBalance(AccCustomerBalance $balance, float $remainingBalance): AccCustomerBalance;
}
