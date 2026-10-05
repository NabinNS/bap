<?php

namespace App\Application\AccQuotations\Actions;

use App\Domain\AccQuotations\DTOs\AccQuotationItemData;
use App\Domain\AccQuotations\Repositories\AccQuotationRepositoryInterface;
use App\Domain\Products\Repositories\ProductRepositoryInterface;
use App\Models\AccQuotation;
use App\Models\AccQuotationItem;
use Illuminate\Support\Facades\DB;

class RecordAccQuotationItemAction
{
    public function __construct(
        private AccQuotationRepositoryInterface $quotations,
        private ProductRepositoryInterface $products,
        private RecalculateAccQuotationTotalsAction $recalculateTotals,
    ) {}

    /**
     * Create one quotation line item (with its own per-row discount) and recompute the
     * quotation's overall discount/VAT breakdown. A quotation is just an estimate — unlike a
     * sale, it never touches the product's stock ledger.
     */
    public function execute(int $tenantId, AccQuotation $quotation, AccQuotationItemData $item): AccQuotationItem
    {
        return DB::transaction(function () use ($tenantId, $quotation, $item) {
            $product = $this->products->lockByUlid($tenantId, $item->productUlid);

            $quotationItem = $this->quotations->createItem($tenantId, $quotation, $product, $item);

            $this->recalculateTotals->execute($quotation);

            return $quotationItem;
        });
    }
}
