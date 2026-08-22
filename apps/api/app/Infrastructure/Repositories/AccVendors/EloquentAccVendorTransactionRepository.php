<?php

namespace App\Infrastructure\Repositories\AccVendors;

use App\Domain\AccVendors\Repositories\AccVendorTransactionRepositoryInterface;
use App\Models\AccVendor;
use App\Models\AccVendorTransaction;
use Illuminate\Pagination\LengthAwarePaginator;

class EloquentAccVendorTransactionRepository implements AccVendorTransactionRepositoryInterface
{
    public function paginate(AccVendor $vendor, int $perPage): LengthAwarePaginator
    {
        return AccVendorTransaction::where('vendor_id', $vendor->id)
            ->orderBy('date', 'asc')
            ->paginate($perPage);
    }
}
