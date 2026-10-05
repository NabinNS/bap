<?php

namespace App\Application\AccQuotations\Actions;

use App\Domain\AccQuotations\DTOs\AccQuotationItemData;
use App\Domain\AccQuotations\Repositories\AccQuotationRepositoryInterface;
use App\Domain\Products\Repositories\ProductRepositoryInterface;
use App\Models\AccQuotation;
use App\Models\AccQuotationItem;
use Illuminate\Support\Facades\DB;

class UpdateAccQuotationItemAction
{
    public function __construct(
        private AccQuotationRepositoryInterface $quotations,
        private ProductRepositoryInterface $products,
        private RecalculateAccQuotationTotalsAction $recalculateTotals,
    ) {}

    public function execute(int $tenantId, AccQuotation $quotation, AccQuotationItem $item, AccQuotationItemData $data): AccQuotationItem
    {
        return DB::transaction(function () use ($tenantId, $quotation, $item, $data) {
            $item = $this->quotations->lockItemForUpdate($item);

            $product = $this->products->lockByUlid($tenantId, $data->productUlid);

            $updated = $this->quotations->updateItem($item, $product, $data);

            $this->recalculateTotals->execute($quotation);

            return $updated;
        });
    }
}
