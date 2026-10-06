<?php

namespace App\Domain\ProductStockBalances\Repositories;

use App\Models\Product;
use App\Models\ProductStockBalance;
use Illuminate\Support\Collection;

interface ProductStockBalanceRepositoryInterface
{
    public function upsert(Product $product, int $fiscalYearId, int $openingQuantity): ProductStockBalance;

    /** All stock balance rows for a tenant in a fiscal year. */
    public function allForFiscalYear(int $tenantId, int $fiscalYearId): Collection;

    /**
     * Bulk-create/update stock balance rows for a fiscal year in a single query. Each row is
     * ['product_id' => int, 'opening_quantity' => int, 'remaining_quantity' => int].
     */
    public function bulkUpsertForFiscalYear(int $tenantId, int $fiscalYearId, array $rows): void;

    /**
     * Fetch (creating on demand) the product's stock balance row for a fiscal year, locked for
     * update so a concurrent recalculation can't interleave its read-then-write.
     */
    public function lockForRecalculation(Product $product, int $fiscalYearId): ProductStockBalance;

    public function updateRemainingQuantity(ProductStockBalance $balance, int $remainingQuantity): ProductStockBalance;
}
