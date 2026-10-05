<?php

namespace App\Domain\AccQuotations\DTOs;

readonly class AccQuotationItemData
{
    public function __construct(
        public string $productUlid,
        public int    $quantity,
        public int    $rate,
        public int    $discount,
    ) {}
}
