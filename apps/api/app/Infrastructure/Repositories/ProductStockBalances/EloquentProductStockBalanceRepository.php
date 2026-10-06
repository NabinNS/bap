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

    public function allForFiscalYear(int $tenantId, int $fiscalYearId): \Illuminate\Support\Collection
    {
        return ProductStockBalance::where('tenant_id', $tenantId)
            ->where('fiscal_year_id', $fiscalYearId)
            ->get();
    }

    public function bulkUpsertForFiscalYear(int $tenantId, int $fiscalYearId, array $rows): void
    {
        if (!$rows) {
            return;
        }

        ProductStockBalance::upsert(
            array_map(fn (array $row) => [
                'tenant_id'          => $tenantId,
                'fiscal_year_id'     => $fiscalYearId,
                'product_id'         => $row['product_id'],
                'opening_quantity'   => $row['opening_quantity'],
                'remaining_quantity' => $row['remaining_quantity'],
            ], $rows),
            ['tenant_id', 'product_id', 'fiscal_year_id'],
            ['opening_quantity', 'remaining_quantity'],
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
