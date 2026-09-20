<?php

namespace App\Application\AccCustomers\Actions;

use App\Domain\AccCustomers\DTOs\AccCustomerTransactionItemData;
use App\Models\AccCustomer;
use App\Models\AccCustomerTransaction;
use App\Models\AccCustomerTransactionItem;

class AddAccCustomerTransactionItemAction
{
    public function __construct(
        private RecordAccCustomerTransactionItemAction $recordItem,
    ) {}

    public function execute(int $tenantId, AccCustomer $customer, AccCustomerTransaction $transaction, AccCustomerTransactionItemData $item): AccCustomerTransactionItem
    {
        return $this->recordItem->execute($tenantId, $customer, $transaction, $item);
    }
}
