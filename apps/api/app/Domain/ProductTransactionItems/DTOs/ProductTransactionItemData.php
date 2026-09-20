<?php

namespace App\Domain\ProductTransactionItems\DTOs;

readonly class ProductTransactionItemData
{
    public function __construct(
        public ?int    $fiscalYearId,
        public string  $date,
        public string  $type,
        public ?int    $purchaseQuantity,
        public ?int    $purchasePrice,
        public ?int    $salesQuantity,
        public ?int    $salesPrice,
    ) {}
}
