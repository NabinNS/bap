<?php

namespace App\Application\AccVendors\Actions;

use App\Domain\AccVendors\DTOs\AccVendorTransactionItemData;
use App\Models\AccVendor;
use App\Models\AccVendorTransaction;
use App\Models\AccVendorTransactionItem;

class AddAccVendorTransactionItemAction
{
    public function __construct(
        private RecordAccVendorTransactionItemAction $recordItem,
    ) {}

    public function execute(int $tenantId, AccVendor $vendor, AccVendorTransaction $transaction, AccVendorTransactionItemData $item): AccVendorTransactionItem
    {
        return $this->recordItem->execute($tenantId, $vendor, $transaction, $item);
    }
}
