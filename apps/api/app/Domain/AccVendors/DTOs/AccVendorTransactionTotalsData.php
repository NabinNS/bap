<?php

namespace App\Domain\AccVendors\DTOs;

readonly class AccVendorTransactionTotalsData
{
    public function __construct(
        public int $discountPercent,
        public int $discountAmount,
        public int $taxableAmount,
        public int $vatAmount,
        public int $grandTotal,
    ) {}
}
