<?php

namespace App\Application\ProductTransactionItems\Actions;

use App\Domain\Products\Repositories\ProductRepositoryInterface;
use App\Models\Product;
use App\Models\ProductTransactionItem;

class ReverseProductTransactionItemAction
{
    public function __construct(
        private ProductRepositoryInterface $products,
    ) {}

    /**
     * Undo one recorded movement's contribution to its product's stock/wacc — the algebraic
     * inverse of CreateProductTransactionItemAction. Exact only if no other movement touched this
     * product since; stock/wacc are clamped at 0 so an out-of-order edit can't drive either
     * negative. Caller must have already locked the product row.
     */
    public function execute(Product $product, ProductTransactionItem $item): void
    {
        if ($item->type === 'purchase') {
            $newStock = max(0, $product->stock - $item->purchase_quantity);
            $newWacc  = $newStock > 0
                ? max(0, (int) round((($product->stock * ($product->wacc ?? $item->purchase_price)) - ($item->purchase_quantity * $item->purchase_price)) / $newStock))
                : 0;

            $this->products->updateStockAndCost($product, $newStock, $newWacc);

            return;
        }

        // Sale reversal: put the sold quantity back; cost basis (wacc) is untouched.
        $this->products->updateStockAndCost($product, $product->stock + $item->sales_quantity, $product->wacc ?? 0);
    }
}
