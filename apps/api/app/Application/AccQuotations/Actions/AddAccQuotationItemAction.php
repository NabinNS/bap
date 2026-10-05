<?php

namespace App\Application\AccQuotations\Actions;

use App\Domain\AccQuotations\DTOs\AccQuotationItemData;
use App\Models\AccQuotation;
use App\Models\AccQuotationItem;

class AddAccQuotationItemAction
{
    public function __construct(
        private RecordAccQuotationItemAction $recordItem,
    ) {}

    public function execute(int $tenantId, AccQuotation $quotation, AccQuotationItemData $item): AccQuotationItem
    {
        return $this->recordItem->execute($tenantId, $quotation, $item);
    }
}
