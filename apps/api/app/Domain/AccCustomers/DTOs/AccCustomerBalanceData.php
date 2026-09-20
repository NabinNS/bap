<?php

namespace App\Domain\AccCustomers\DTOs;

readonly class AccCustomerBalanceData
{
    public function __construct(
        public float $openingBalance,
        public ?int  $fiscalYearId,
    ) {}
}
