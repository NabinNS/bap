<?php

namespace App\Application\AccCustomers\Actions;

use App\Domain\AccCustomers\DTOs\AccCustomerData;
use App\Domain\AccCustomers\Repositories\AccCustomerRepositoryInterface;
use App\Models\AccCustomer;

class CreateAccCustomerAction
{
    public function __construct(
        private AccCustomerRepositoryInterface $customers,
    ) {}

    public function execute(int $tenantId, AccCustomerData $data): AccCustomer
    {
        return $this->customers->create($tenantId, $data);
    }
}
