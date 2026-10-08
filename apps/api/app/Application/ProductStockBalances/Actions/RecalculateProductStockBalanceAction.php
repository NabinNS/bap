<?php

namespace App\Application\ProductStockBalances\Actions;

use App\Domain\ProductStockBalances\Repositories\ProductStockBalanceRepositoryInterface;
use App\Domain\ProductTransactionItems\Repositories\ProductTransactionItemRepositoryInterface;
use App\Models\Product;
use Illuminate\Support\Facades\DB;

class RecalculateProductStockBalanceAction
{
    public function __construct(
        private ProductStockBalanceRepositoryInterface $balances,
        private ProductTransactionItemRepositoryInterface $items,
    ) {}

    /**
     * Recompute a product's remaining quantity for a given fiscal year:
     * opening_quantity + sum(purchase_quantity) - sum(sales_quantity) across that year's
     * transaction items.
     *
     * The balance row is created on demand (with opening_quantity defaulting to 0) so that
     * products with no manually-entered opening quantity still track their running balance.
     *
     * Locks the balance row for the duration so concurrent recalculations (e.g. two
     * transaction items being recorded at once) can't interleave their read-then-write.
     *
     * Only touches this one fiscal year — it does NOT cascade into later years. A transaction
     * item recorded into a non-active (e.g. past) fiscal year can make later years'
     * opening_quantity stale; that's resolved on demand via SyncProductStockBalanceAction
     * ("Sync Balance" button), not automatically on every save, so a later year's
     * manually-entered opening_quantity is never silently overwritten without the user
     * explicitly asking for it.
     */
    public function execute(Product $product, int $fiscalYearId): void
    {
        DB::transaction(function () use ($product, $fiscalYearId) {
            $balance = $this->balances->lockForRecalculation($product, $fiscalYearId);

            $net = $this->items->netQuantity($product, $fiscalYearId);

            $this->balances->updateRemainingQuantity(
                $balance,
                $balance->opening_quantity + $net,
            );
        });
    }
}
