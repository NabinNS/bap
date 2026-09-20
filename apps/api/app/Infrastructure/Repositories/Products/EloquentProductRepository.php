<?php

namespace App\Infrastructure\Repositories\Products;

use App\Domain\Products\DTOs\ProductData;
use App\Domain\Products\DTOs\ProductFilterData;
use App\Domain\Products\Repositories\ProductRepositoryInterface;
use App\Models\Product;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

class EloquentProductRepository implements ProductRepositoryInterface
{
    public function searchLite(int $tenantId, ?string $search, int $limit): Collection
    {
        return Product::where('tenant_id', $tenantId)
            ->select(['ulid', 'name', 'sku', 'cost_price', 'sales_price'])
            ->when($search, fn($q, $v) => $q->where(
                fn($q) => $q->where('name', 'ilike', "%$v%")->orWhere('sku', 'ilike', "%$v%")
            ))
            ->orderBy($search ? 'name' : 'created_at', $search ? 'asc' : 'desc')
            ->limit($limit)
            ->get();
    }

    public function paginate(int $tenantId, int $perPage, ProductFilterData $filters): LengthAwarePaginator
    {
        return Product::where('tenant_id', $tenantId)
            ->with(['category', 'brand', 'imageGroups.imageItems', 'activeDiscount', 'stockBalances'])
            ->when($filters->search, fn($q, $v) => $q->where(
                fn($q) => $q->where('name', 'ilike', "%$v%")->orWhere('sku', 'ilike', "%$v%")
            ))
            ->when($filters->isActive !== null, fn($q) => $q->where('is_active', $filters->isActive))
            ->when($filters->categoryUlid, fn($q, $v) =>
                $q->whereHas('category', fn($q) => $q->where('ulid', $v))
            )
            ->when($filters->brandUlid, fn($q, $v) =>
                $q->whereHas('brand', fn($q) => $q->where('ulid', $v))
            )
            ->when($filters->minPrice !== null, fn($q) => $q->where('sales_price', '>=', $filters->minPrice))
            ->when($filters->maxPrice !== null, fn($q) => $q->where('sales_price', '<=', $filters->maxPrice))
            ->when($filters->hasDiscount, fn($q) =>
                $q->whereHas('activeDiscount')
            )
            ->orderBy($filters->sortBy, $filters->sortDir)
            ->paginate($perPage);
    }

    public function findByUlid(int $tenantId, string $ulid): Product
    {
        return Product::where('tenant_id', $tenantId)
            ->where('ulid', $ulid)
            ->with(['category', 'brand', 'imageGroups.imageItems', 'activeDiscount', 'stockBalances'])
            ->firstOrFail();
    }

    public function lockByUlid(int $tenantId, string $ulid): Product
    {
        return Product::where('tenant_id', $tenantId)
            ->where('ulid', $ulid)
            ->lockForUpdate()
            ->firstOrFail();
    }

    public function lockById(int $tenantId, int $id): Product
    {
        return Product::where('tenant_id', $tenantId)
            ->where('id', $id)
            ->lockForUpdate()
            ->firstOrFail();
    }

    public function updateStockAndCost(Product $product, int $stock, int $wacc): Product
    {
        $product->update([
            'stock' => $stock,
            'wacc'  => $wacc,
        ]);

        return $product;
    }

    public function create(int $tenantId, ProductData $data): Product
    {
        return Product::create([
            'tenant_id'          => $tenantId,
            'category_id'        => $data->categoryId,
            'brand_id'           => $data->brandId,
            'name'               => $data->name,
            'sku'                => $data->sku,
            'slug'               => $data->slug,
            'description'        => $data->description,
            'image'              => $data->image,
            'cost_price'         => $data->costPrice,
            'sales_price'        => $data->salesPrice,
            'stock'              => $data->stock,
            'low_stock_quantity' => $data->lowStockQuantity,
            'is_active'          => $data->isActive,
            'is_featured'        => $data->isFeatured,
            'sort_order'             => $data->sortOrder,
            'additional_information' => $data->additionalInformation,
        ]);
    }

    public function update(Product $product, ProductData $data): Product
    {
        $product->update([
            'category_id'        => $data->categoryId,
            'brand_id'           => $data->brandId,
            'name'               => $data->name,
            'sku'                => $data->sku,
            'slug'               => $data->slug,
            'description'        => $data->description,
            'image'              => $data->image,
            'cost_price'         => $data->costPrice,
            'sales_price'        => $data->salesPrice,
            'stock'              => $data->stock,
            'low_stock_quantity' => $data->lowStockQuantity,
            'is_active'          => $data->isActive,
            'is_featured'        => $data->isFeatured,
            'sort_order'             => $data->sortOrder,
            'additional_information' => $data->additionalInformation,
        ]);

        return $product->fresh();
    }

    public function delete(Product $product): void
    {
        $product->delete();
    }
}
