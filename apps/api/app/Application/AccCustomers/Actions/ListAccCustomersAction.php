<?php

namespace App\Application\AccCustomers\Actions;

use App\Domain\AccCustomers\DTOs\AccCustomerFilterData;
use App\Domain\AccCustomers\Repositories\AccCustomerRepositoryInterface;
use Illuminate\Pagination\LengthAwarePaginator;

class ListAccCustomersAction
{
    public function __construct(
        private AccCustomerRepositoryInterface $customers,
    ) {}

    public function execute(int $tenantId, int $perPage = 15, AccCustomerFilterData $filters = new AccCustomerFilterData()): LengthAwarePaginator
    {
        return $this->customers->paginate($tenantId, $perPage, $filters);
    }
}
