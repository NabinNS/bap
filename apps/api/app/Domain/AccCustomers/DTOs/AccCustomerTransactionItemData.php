<?php

namespace App\Domain\AccCustomers\DTOs;

readonly class AccCustomerTransactionItemData
{
    public function __construct(
        public string $productUlid,
        public int    $quantity,
        public int    $rate,
        public int    $discount,
    ) {}
}
