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

    public function netTotal(AccVendor $vendor, int $fiscalYearId): float
    {
        return (float) $vendor->transactions()
            ->where('fiscal_year_id', $fiscalYearId)
            ->selectRaw('COALESCE(SUM(credit), 0) - COALESCE(SUM(debit), 0) as net')
            ->value('net');
    }
}
