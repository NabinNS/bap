<?php

namespace App\Application\ProductStockBalances\Actions;

use App\Domain\ProductStockBalances\Repositories\ProductStockBalanceRepositoryInterface;
use App\Domain\Products\Repositories\ProductRepositoryInterface;
use App\Domain\ProductTransactionItems\Repositories\ProductTransactionItemRepositoryInterface;

class SyncProductFiscalYearStockBalancesAction
{
    public function __construct(
        private ProductStockBalanceRepositoryInterface $balances,
        private ProductTransactionItemRepositoryInterface $items,
        private ProductRepositoryInterface $products,
        private RecalculateProductStockBalanceAction $recalculateBalance,
    ) {}

    /**
     * Carry each product's remaining_quantity from the source fiscal year into the target
     * fiscal year's opening_quantity.
     *
     * A product is skipped if the target year already has a stock balance row for it with a
     * non-zero opening_quantity or any transaction item recorded — either means a human (or
     * an earlier sync) already established that year's stock and it must not be overwritten.
     *
     * Which products need syncing is decided with a handful of bulk queries (not one query
     * per product), so this stays fast for tenants with thousands of products. Only the
     * products that actually need a new opening_quantity are then recalculated individually
     * via the shared, lock-protected RecalculateProductStockBalanceAction — this is normally a
     * small subset (new products since the last sync), and keeps the remaining_quantity
     * formula in one place instead of duplicating it here.
     *
     * Returns the number of products synced.
     */
    public function execute(int $tenantId, int $fromFiscalYearId, int $toFiscalYearId): int
    {
        $sourceBalances = $this->balances->allForFiscalYear($tenantId, $fromFiscalYearId);

        if ($sourceBalances->isEmpty()) {
            return 0;
        }

        $targetBalances = $this->balances->allForFiscalYear($tenantId, $toFiscalYearId)->keyBy('product_id');
        $targetNetQuantities = $this->items->netQuantitiesForFiscalYear($tenantId, $toFiscalYearId);

        $rows = [];

        foreach ($sourceBalances as $sourceBalance) {
            $productId = $sourceBalance->product_id;
            $target = $targetBalances->get($productId);
            $hasItems = array_key_exists($productId, $targetNetQuantities);

            if ($target && ($target->opening_quantity !== 0 || $hasItems)) {
                continue;
            }

            $opening = $sourceBalance->remaining_quantity;

            $rows[] = [
                'product_id'         => $productId,
                'opening_quantity'   => $opening,
                'remaining_quantity' => $opening,
            ];
        }

        if (!$rows) {
            return 0;
        }

        $this->balances->bulkUpsertForFiscalYear($tenantId, $toFiscalYearId, $rows);

        $syncedProducts = $this->products->findByIds($tenantId, array_column($rows, 'product_id'));
        foreach ($syncedProducts as $product) {
            $this->recalculateBalance->execute($product, $toFiscalYearId);
        }

        return count($rows);
    }
}
