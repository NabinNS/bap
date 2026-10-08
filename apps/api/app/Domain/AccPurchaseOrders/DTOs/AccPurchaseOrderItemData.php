<?php

namespace App\Domain\AccPurchaseOrders\DTOs;

readonly class AccPurchaseOrderItemData
{
    public function __construct(
        public string $productUlid,
        public ?int   $quantity = null,
        public ?float $rate = null,
    ) {}
}
