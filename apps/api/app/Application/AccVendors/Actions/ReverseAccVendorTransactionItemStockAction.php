<?php

namespace App\Application\AccVendors\Actions;

use App\Domain\Products\Repositories\ProductRepositoryInterface;
use App\Models\AccVendorTransactionItem;

class ReverseAccVendorTransactionItemStockAction
{
    public function __construct(
        private ProductRepositoryInterface $products,
    ) {}

    /**
     * Undo one recorded item's contribution to its product's stock/wacc — the algebraic inverse
     * of the blend in RecordAccVendorTransactionItemAction. Exact only if no other stock movement
     * touched this product since the item was recorded; stock/wacc are clamped at 0 so an item
     * outlived by later sales can't drive either negative.
     */
    public function execute(int $tenantId, AccVendorTransactionItem $item): void
    {
        $product = $this->products->lockById($tenantId, $item->product_id);

        $newStock = max(0, $product->stock - $item->quantity);
        $newWacc  = $newStock > 0
            ? max(0, (int) round((($product->stock * ($product->wacc ?? $item->rate)) - ($item->quantity * $item->rate)) / $newStock))
            : 0;

        $this->products->updateStockAndCost($product, $newStock, $newWacc);
    }
}
