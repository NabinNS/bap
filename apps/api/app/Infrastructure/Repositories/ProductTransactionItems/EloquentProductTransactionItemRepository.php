<?php

namespace App\Infrastructure\Repositories\ProductTransactionItems;

use App\Domain\ProductTransactionItems\DTOs\ProductTransactionItemData;
use App\Domain\ProductTransactionItems\Repositories\ProductTransactionItemRepositoryInterface;
use App\Models\Product;
use App\Models\ProductTransactionItem;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

class EloquentProductTransactionItemRepository implements ProductTransactionItemRepositoryInterface
{
    public function paginate(Product $product, int $perPage): LengthAwarePaginator
    {
        return ProductTransactionItem::where('product_id', $product->id)
            ->orderBy('date', 'asc')
            ->orderBy('id', 'asc')
            ->paginate($perPage);
    }

    public function trashed(Product $product): Collection
    {
        return ProductTransactionItem::onlyTrashed()
            ->where('product_id', $product->id)
            ->orderBy('deleted_at', 'desc')
            ->get();
    }

    public function restore(int $tenantId, Product $product, string $itemUlid): ProductTransactionItem
    {
        $item = ProductTransactionItem::onlyTrashed()
            ->where('ulid', $itemUlid)
            ->where('product_id', $product->id)
            ->where('tenant_id', $tenantId)
            ->firstOrFail();

        $item->restore();

        return $item->fresh();
    }

    public function netQuantity(Product $product, int $fiscalYearId): int
    {
        return (int) $product->productTransactionItems()
            ->where('fiscal_year_id', $fiscalYearId)
            ->selectRaw('COALESCE(SUM(purchase_quantity), 0) - COALESCE(SUM(sales_quantity), 0) as net')
            ->value('net');
    }

    public function create(int $tenantId, Product $product, ProductTransactionItemData $data): ProductTransactionItem
    {
        return $product->productTransactionItems()->create([
            'tenant_id'         => $tenantId,
            'fiscal_year_id'    => $data->fiscalYearId,
            'date'              => $data->date,
            'type'              => $data->type,
            'purchase_quantity' => $data->purchaseQuantity,
            'purchase_price'    => $data->purchasePrice,
            'sales_quantity'    => $data->salesQuantity,
            'sales_price'       => $data->salesPrice,
        ]);
    }

    public function lockForUpdate(ProductTransactionItem $item): ProductTransactionItem
    {
        return ProductTransactionItem::lockForUpdate()->findOrFail($item->id);
    }

    public function update(ProductTransactionItem $item, ProductTransactionItemData $data): ProductTransactionItem
    {
        $item->update([
            'fiscal_year_id'    => $data->fiscalYearId,
            'date'              => $data->date,
            'type'              => $data->type,
            'purchase_quantity' => $data->purchaseQuantity,
            'purchase_price'    => $data->purchasePrice,
            'sales_quantity'    => $data->salesQuantity,
            'sales_price'       => $data->salesPrice,
        ]);

        return $item->fresh();
    }

    public function delete(ProductTransactionItem $item): void
    {
        $item->delete();
    }
}
