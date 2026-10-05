<?php

namespace App\Domain\AccQuotations\DTOs;

readonly class AccQuotationData
{
    /** @param AccQuotationItemData[] $items */
    public function __construct(
        public string  $date,
        public ?string $voucherNo,
        public ?int    $discountPercent,
        public array   $items,
        /** Falls back to the tenant's active fiscal year when omitted. */
        public ?int    $fiscalYearId = null,
    ) {}
}
