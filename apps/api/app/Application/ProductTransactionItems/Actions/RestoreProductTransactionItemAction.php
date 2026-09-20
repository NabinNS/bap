<?php

namespace App\Application\ProductTransactionItems\Actions;

use App\Application\ProductStockBalances\Actions\RecalculateProductStockBalanceAction;
use App\Domain\Products\Repositories\ProductRepositoryInterface;
use App\Domain\ProductTransactionItems\Repositories\ProductTransactionItemRepositoryInterface;
use App\Models\Product;
use App\Models\ProductTransactionItem;
use Illuminate\Support\Facades\DB;

class RestoreProductTransactionItemAction
{
    public function __construct(
        private ProductTransactionItemRepositoryInterface $items,
        private ProductRepositoryInterface $products,
        private RecalculateProductStockBalanceAction $recalculateBalance,
    ) {}

    /**
     * Restores the row and re-applies its stock/wacc contribution — the inverse of
     * ReverseProductTransactionItemAction, so a restored purchase/sale counts again.
     */
    public function execute(int $tenantId, Product $product, string $itemUlid): ProductTransactionItem
    {
        return DB::transaction(function () use ($tenantId, $product, $itemUlid) {
            $item = $this->items->restore($tenantId, $product, $itemUlid);
            $locked   = $this->products->lockByUlid($tenantId, $product->ulid);

            if ($item->type === 'purchase') {
                $currentStock = $locked->stock;
                $currentCost  = $locked->wacc ?? $item->purchase_price;
                $newStock     = $currentStock + $item->purchase_quantity;
                $newWacc      = $newStock > 0
                    ? (int) round((($currentStock * $currentCost) + ($item->purchase_quantity * $item->purchase_price)) / $newStock)
                    : $item->purchase_price;

                $this->products->updateStockAndCost($locked, $newStock, $newWacc);
            } else {
                $this->products->updateStockAndCost($locked, max(0, $locked->stock - $item->sales_quantity), $locked->wacc ?? 0);
            }

            $this->recalculateBalance->execute($locked, $item->fiscal_year_id);

            return $item;
        });
    }
}
