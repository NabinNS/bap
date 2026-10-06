<?php

namespace App\Domain\Settings\DTOs;

readonly class SyncFiscalYearBalancesResult
{
    public function __construct(
        public int $customersSynced,
        public int $vendorsSynced,
    ) {}
}
