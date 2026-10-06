<?php

namespace App\Domain\AccCustomers\Repositories;

use App\Domain\AccCustomers\DTOs\AccCustomerData;
use App\Domain\AccCustomers\DTOs\AccCustomerFilterData;
use App\Models\AccCustomer;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

interface AccCustomerRepositoryInterface
{
    public function paginate(int $tenantId, int $perPage, AccCustomerFilterData $filters): LengthAwarePaginator;

    public function create(int $tenantId, AccCustomerData $data): AccCustomer;

    public function update(AccCustomer $customer, AccCustomerData $data): AccCustomer;

    public function delete(AccCustomer $customer): void;

    public function trashed(int $tenantId): Collection;

    /** @param int[] $ids @return Collection<int, AccCustomer> */
    public function findByIds(int $tenantId, array $ids): Collection;

    public function restore(int $tenantId, string $customerUlid): AccCustomer;
}
