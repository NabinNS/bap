<?php

namespace App\Domain\AccCustomers\DTOs;

readonly class AccCustomerTransactionTotalsData
{
    public function __construct(
        public int $discountPercent,
        public int $discountAmount,
        public int $taxableAmount,
        public int $vatAmount,
        public int $grandTotal,
    ) {}
}
