<?php

namespace App\Domain\AccVendors\DTOs;

readonly class AccVendorBalanceData
{
    public function __construct(
        public float $openingBalance,
        public ?int  $fiscalYearId,
    ) {}
}
