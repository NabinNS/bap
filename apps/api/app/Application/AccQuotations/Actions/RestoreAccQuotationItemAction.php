<?php

namespace App\Application\AccQuotations\Actions;

use App\Domain\AccQuotations\Repositories\AccQuotationRepositoryInterface;
use App\Models\AccQuotation;
use App\Models\AccQuotationItem;
use Illuminate\Support\Facades\DB;

class RestoreAccQuotationItemAction
{
    public function __construct(
        private AccQuotationRepositoryInterface $quotations,
        private RecalculateAccQuotationTotalsAction $recalculateTotals,
    ) {}

    public function execute(int $tenantId, AccQuotation $quotation, string $itemUlid): AccQuotationItem
    {
        return DB::transaction(function () use ($tenantId, $quotation, $itemUlid) {
            $item = $this->quotations->restoreItem($tenantId, $quotation, $itemUlid);

            $this->recalculateTotals->execute($quotation);

            return $item;
        });
    }
}
