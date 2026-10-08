<?php

namespace App\Domain\AccPurchaseOrders\DTOs;

readonly class AccPurchaseOrderData
{
    /** @param AccPurchaseOrderItemData[] $items */
    public function __construct(
        public string  $date,
        public ?string $voucherNo,
        public array   $items,
        /** Falls back to the tenant's active fiscal year when omitted. */
        public ?int    $fiscalYearId = null,
    ) {}
}
