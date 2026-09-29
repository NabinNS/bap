<?php

namespace App\Infrastructure\Repositories\AccCustomers;

use App\Domain\AccCustomers\DTOs\AccCustomerData;
use App\Domain\AccCustomers\DTOs\AccCustomerFilterData;
use App\Domain\AccCustomers\Repositories\AccCustomerRepositoryInterface;
use App\Models\AccCustomer;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

class EloquentAccCustomerRepository implements AccCustomerRepositoryInterface
{
    public function paginate(int $tenantId, int $perPage, AccCustomerFilterData $filters): LengthAwarePaginator
    {
        return AccCustomer::where('tenant_id', $tenantId)
            ->with('balances')
            ->when($filters->search, fn($q, $v) => $q->where('name', 'like', "%$v%"))
            ->orderBy($filters->sortBy, $filters->sortDir)
            ->paginate($perPage);
    }

    public function create(int $tenantId, AccCustomerData $data): AccCustomer
    {
        return AccCustomer::create([
            'tenant_id' => $tenantId,
            'name'      => $data->name,
            'address'   => $data->address,
            'phone'     => $data->phone,
            'telephone' => $data->telephone,
            'vat_no'    => $data->vatNo,
        ]);
    }

    public function update(AccCustomer $customer, AccCustomerData $data): AccCustomer
    {
        $customer->update([
            'name'      => $data->name,
            'address'   => $data->address,
            'phone'     => $data->phone,
            'telephone' => $data->telephone,
            'vat_no'    => $data->vatNo,
        ]);

        return $customer->fresh();
    }

    public function delete(AccCustomer $customer): void
    {
        $customer->delete();
    }

    public function trashed(int $tenantId): Collection
    {
        return AccCustomer::onlyTrashed()
            ->where('tenant_id', $tenantId)
            ->orderBy('deleted_at', 'desc')
            ->get();
    }

    public function restore(int $tenantId, string $customerUlid): AccCustomer
    {
        $customer = AccCustomer::onlyTrashed()
            ->where('ulid', $customerUlid)
            ->where('tenant_id', $tenantId)
            ->firstOrFail();

        $customer->restore();

        return $customer->fresh();
    }
}
