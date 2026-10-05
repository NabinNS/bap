<?php

namespace App\Domain\AccQuotations\DTOs;

readonly class AccQuotationTotalsData
{
    public function __construct(
        public int $discountPercent,
        public int $discountAmount,
        public int $taxableAmount,
        public int $vatAmount,
        public int $grandTotal,
    ) {}
}
