<?php

namespace App\Application\AccCustomers\Actions;

use App\Domain\AccCustomers\DTOs\AccCustomerData;
use App\Domain\AccCustomers\Repositories\AccCustomerRepositoryInterface;
use App\Models\AccCustomer;

class UpdateAccCustomerAction
{
    public function __construct(
        private AccCustomerRepositoryInterface $customers,
    ) {}

    public function execute(AccCustomer $customer, AccCustomerData $data): AccCustomer
    {
        return $this->customers->update($customer, $data);
    }
}
