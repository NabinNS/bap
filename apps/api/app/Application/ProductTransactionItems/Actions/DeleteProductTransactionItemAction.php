<?php

namespace App\Application\ProductTransactionItems\Actions;

use App\Application\ProductStockBalances\Actions\RecalculateProductStockBalanceAction;
use App\Domain\Products\Repositories\ProductRepositoryInterface;
use App\Domain\ProductTransactionItems\Repositories\ProductTransactionItemRepositoryInterface;
use App\Models\Product;
use App\Models\ProductTransactionItem;
use Illuminate\Support\Facades\DB;

class DeleteProductTransactionItemAction
{
    public function __construct(
        private ProductTransactionItemRepositoryInterface $items,
        private ProductRepositoryInterface $products,
        private ReverseProductTransactionItemAction $reverseItem,
        private RecalculateProductStockBalanceAction $recalculateBalance,
    ) {}

    public function execute(int $tenantId, Product $product, ProductTransactionItem $item): void
    {
        DB::transaction(function () use ($tenantId, $product, $item) {
            $item = $this->items->lockForUpdate($item);
            $locked   = $this->products->lockByUlid($tenantId, $product->ulid);
            $fiscalYearId = $item->fiscal_year_id;

            $this->reverseItem->execute($locked, $item);
            $this->items->delete($item);

            $this->recalculateBalance->execute($locked, $fiscalYearId);
        });
    }
}
