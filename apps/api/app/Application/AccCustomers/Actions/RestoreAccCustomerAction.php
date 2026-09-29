<?php

namespace App\Application\AccCustomers\Actions;

use App\Domain\AccCustomers\Repositories\AccCustomerRepositoryInterface;
use App\Models\AccCustomer;

class RestoreAccCustomerAction
{
    public function __construct(
        private AccCustomerRepositoryInterface $customers,
    ) {}

    public function execute(int $tenantId, string $customerUlid): AccCustomer
    {
        return $this->customers->restore($tenantId, $customerUlid);
    }
}
