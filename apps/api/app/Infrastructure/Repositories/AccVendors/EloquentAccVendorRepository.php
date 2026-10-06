<?php

namespace App\Infrastructure\Repositories\AccVendors;

use App\Domain\AccVendors\DTOs\AccVendorData;
use App\Domain\AccVendors\DTOs\AccVendorFilterData;
use App\Domain\AccVendors\Repositories\AccVendorRepositoryInterface;
use App\Models\AccVendor;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

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

    public function findByIds(int $tenantId, array $ids): Collection
    {
        return AccVendor::where('tenant_id', $tenantId)
            ->whereIn('id', $ids)
            ->get();
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

    public function trashed(int $tenantId): Collection
    {
        return AccVendor::onlyTrashed()
            ->where('tenant_id', $tenantId)
            ->orderBy('deleted_at', 'desc')
            ->get();
    }

    public function restore(int $tenantId, string $vendorUlid): AccVendor
    {
        $vendor = AccVendor::onlyTrashed()
            ->where('ulid', $vendorUlid)
            ->where('tenant_id', $tenantId)
            ->firstOrFail();

        $vendor->restore();

        return $vendor->fresh();
    }
}
