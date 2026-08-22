<?php

namespace App\Domain\AccVendors\Repositories;

use App\Models\AccVendor;
use App\Models\AccVendorOpeningBalance;

interface AccVendorOpeningBalanceRepositoryInterface
{
    public function upsert(AccVendor $vendor, int $fiscalYearId, float $openingBalance): AccVendorOpeningBalance;
}
