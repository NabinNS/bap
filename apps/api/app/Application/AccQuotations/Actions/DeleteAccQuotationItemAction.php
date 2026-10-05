<?php

namespace App\Application\AccQuotations\Actions;

use App\Domain\AccQuotations\Repositories\AccQuotationRepositoryInterface;
use App\Models\AccQuotation;
use App\Models\AccQuotationItem;
use Illuminate\Support\Facades\DB;

class DeleteAccQuotationItemAction
{
    public function __construct(
        private AccQuotationRepositoryInterface $quotations,
        private RecalculateAccQuotationTotalsAction $recalculateTotals,
    ) {}

    /**
     * Deleting the last remaining item leaves nothing for the totals recalculation to derive a
     * quote from — removes the whole (now-empty) quotation instead, per product decision.
     */
    public function execute(AccQuotation $quotation, AccQuotationItem $item): void
    {
        DB::transaction(function () use ($quotation, $item) {
            $item = $this->quotations->lockItemForUpdate($item);
            $this->quotations->deleteItem($item);

            if ($this->quotations->itemsCount($quotation) === 0) {
                $this->quotations->delete($quotation);
                return;
            }

            $this->recalculateTotals->execute($quotation);
        });
    }
}
