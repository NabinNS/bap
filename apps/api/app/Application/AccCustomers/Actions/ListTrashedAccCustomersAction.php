<?php

namespace App\Application\AccCustomers\Actions;

use App\Domain\AccCustomers\Repositories\AccCustomerRepositoryInterface;
use Illuminate\Support\Collection;

class ListTrashedAccCustomersAction
{
    public function __construct(
        private AccCustomerRepositoryInterface $customers,
    ) {}

    public function execute(int $tenantId): Collection
    {
        return $this->customers->trashed($tenantId);
    }
}
