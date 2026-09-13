<?php

namespace App\Domain\AccVendors\DTOs;

readonly class AccVendorTransactionItemData
{
    public function __construct(
        public string $productUlid,
        public int    $quantity,
        public int    $rate,
        public int    $discount,
    ) {}
}
