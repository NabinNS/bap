<?php

namespace App\Domain\AccVendors\Repositories;

use App\Models\AccVendor;
use Illuminate\Pagination\LengthAwarePaginator;

interface AccVendorTransactionRepositoryInterface
{
    public function paginate(AccVendor $vendor, int $perPage): LengthAwarePaginator;
}
