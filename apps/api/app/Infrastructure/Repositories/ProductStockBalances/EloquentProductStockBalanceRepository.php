<?php

namespace App\Infrastructure\Repositories\ProductStockBalances;

use App\Domain\ProductStockBalances\Repositories\ProductStockBalanceRepositoryInterface;
use App\Models\Product;
use App\Models\ProductStockBalance;

class EloquentProductStockBalanceRepository implements ProductStockBalanceRepositoryInterface
{
    public function upsert(Product $product, int $fiscalYearId, int $openingQuantity): ProductStockBalance
    {
        return ProductStockBalance::updateOrCreate(
            [
                'tenant_id'      => $product->tenant_id,
                'product_id'     => $product->id,
                'fiscal_year_id' => $fiscalYearId,
            ],
            [
                'opening_quantity' => $openingQuantity,
            ]
        );
    }

    public function lockForRecalculation(Product $product, int $fiscalYearId): ProductStockBalance
    {
        return ProductStockBalance::lockForUpdate()->firstOrCreate([
            'tenant_id'      => $product->tenant_id,
            'product_id'     => $product->id,
            'fiscal_year_id' => $fiscalYearId,
        ]);
    }

    public function updateRemainingQuantity(ProductStockBalance $balance, int $remainingQuantity): ProductStockBalance
    {
        $balance->update(['remaining_quantity' => $remainingQuantity]);

        return $balance;
    }
}
