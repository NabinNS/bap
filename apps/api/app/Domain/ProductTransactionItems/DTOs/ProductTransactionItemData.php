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
        public ?string $referenceType = null,
        public ?int    $referenceId = null,
        // Snapshot of the product's wacc at the moment of a sale — captured so profit/loss on
        // that sale stays accurate even after later purchases blend the product's wacc further.
        // Null for purchase rows.
        public ?int    $costPrice = null,
        /** 'cash' or 'credit'; only meaningful for purchase/sale rows entered directly (not references). */
        public ?string $paymentType = null,
    ) {}
}
