<?php

namespace App\Infrastructure\Repositories\AccVendors;

use App\Domain\AccVendors\DTOs\AccVendorData;
use App\Domain\AccVendors\DTOs\AccVendorFilterData;
use App\Domain\AccVendors\Repositories\AccVendorRepositoryInterface;
use App\Models\AccVendor;
use Illuminate\Pagination\LengthAwarePaginator;

class EloquentAccVendorRepository implements AccVendorRepositoryInterface
{
    public function paginate(int $tenantId, int $perPage, AccVendorFilterData $filters): LengthAwarePaginator
    {
        return AccVendor::where('tenant_id', $tenantId)
            ->with('balances')
            ->when($filters->search, fn($q, $v) => $q->where('name', 'like', "%$v%"))
            ->orderBy($filters->sortBy, $filters->sortDir)
            ->paginate($perPage);
    }

    public function create(int $tenantId, AccVendorData $data): AccVendor
    {
        return AccVendor::create([
            'tenant_id' => $tenantId,
            'name'      => $data->name,
            'address'   => $data->address,
            'phone'     => $data->phone,
            'telephone' => $data->telephone,
            'vat_no'    => $data->vatNo,
        ]);
    }

    public function update(AccVendor $vendor, AccVendorData $data): AccVendor
    {
        $vendor->update([
            'name'      => $data->name,
            'address'   => $data->address,
            'phone'     => $data->phone,
            'telephone' => $data->telephone,
            'vat_no'    => $data->vatNo,
        ]);

        return $vendor->fresh();
    }

    public function delete(AccVendor $vendor): void
    {
        $vendor->delete();
    }
}
