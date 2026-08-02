<?php

namespace App\Infrastructure\Repositories\Products;

use App\Domain\Products\DTOs\ProductData;
use App\Domain\Products\DTOs\ProductFilterData;
use App\Domain\Products\Repositories\ProductRepositoryInterface;
use App\Models\Product;
use Illuminate\Pagination\LengthAwarePaginator;

class EloquentProductRepository implements ProductRepositoryInterface
{
    public function paginate(int $tenantId, int $perPage, ProductFilterData $filters): LengthAwarePaginator
    {
        return Product::where('tenant_id', $tenantId)
            ->with(['category', 'brand', 'imageGroups.imageItems'])
            ->when($filters->search, fn($q, $v) => $q->where('name', 'like', "%$v%"))
            ->when($filters->isActive !== null, fn($q) => $q->where('is_active', $filters->isActive))
            ->when($filters->categoryUlid, fn($q, $v) =>
                $q->whereHas('category', fn($q) => $q->where('ulid', $v))
            )
            ->orderBy($filters->sortBy, $filters->sortDir)
            ->paginate($perPage);
    }

    public function findByUlid(int $tenantId, string $ulid): Product
    {
        return Product::where('tenant_id', $tenantId)
            ->where('ulid', $ulid)
            ->with(['category', 'brand'])
            ->firstOrFail();
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
            'sort_order'         => $data->sortOrder,
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
            'sort_order'         => $data->sortOrder,
        ]);

        return $product->fresh();
    }

    public function delete(Product $product): void
    {
        $product->delete();
    }
}
