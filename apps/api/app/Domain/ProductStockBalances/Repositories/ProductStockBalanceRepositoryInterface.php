<?php

namespace App\Domain\ProductStockBalances\Repositories;

use App\Models\Product;
use App\Models\ProductStockBalance;

interface ProductStockBalanceRepositoryInterface
{
    public function upsert(Product $product, int $fiscalYearId, int $openingQuantity): ProductStockBalance;

    /**
     * Fetch (creating on demand) the product's stock balance row for a fiscal year, locked for
     * update so a concurrent recalculation can't interleave its read-then-write.
     */
    public function lockForRecalculation(Product $product, int $fiscalYearId): ProductStockBalance;

    public function updateRemainingQuantity(ProductStockBalance $balance, int $remainingQuantity): ProductStockBalance;
}
