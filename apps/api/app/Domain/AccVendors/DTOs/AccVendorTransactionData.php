<?php

namespace App\Domain\AccVendors\DTOs;

readonly class AccVendorTransactionData
{
    /** @param AccVendorTransactionItemData[] $items */
    public function __construct(
        public string  $date,
        public string  $particular,
        public ?string $voucherNo,
        public ?string $chequeNo,
        public ?float  $debit,
        public ?float  $credit,
        public ?int    $discountPercent,
        public array   $items,
        /** Falls back to the tenant's active fiscal year when omitted. */
        public ?int    $fiscalYearId = null,
    ) {}
}
