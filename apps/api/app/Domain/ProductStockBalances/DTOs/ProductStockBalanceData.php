<?php

namespace App\Domain\ProductStockBalances\DTOs;

readonly class ProductStockBalanceData
{
    public function __construct(
        public int $openingQuantity,
        public ?int $fiscalYearId,
    ) {}
}
