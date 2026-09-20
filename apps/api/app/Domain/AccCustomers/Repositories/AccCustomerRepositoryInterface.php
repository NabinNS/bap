<?php

namespace App\Domain\AccCustomers\Repositories;

use App\Domain\AccCustomers\DTOs\AccCustomerData;
use App\Domain\AccCustomers\DTOs\AccCustomerFilterData;
use App\Models\AccCustomer;
use Illuminate\Pagination\LengthAwarePaginator;

interface AccCustomerRepositoryInterface
{
    public function paginate(int $tenantId, int $perPage, AccCustomerFilterData $filters): LengthAwarePaginator;

    public function create(int $tenantId, AccCustomerData $data): AccCustomer;

    public function update(AccCustomer $customer, AccCustomerData $data): AccCustomer;

    public function delete(AccCustomer $customer): void;
}
