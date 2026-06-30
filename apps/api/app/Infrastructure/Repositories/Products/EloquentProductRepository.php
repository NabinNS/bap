<?php

namespace App\Infrastructure\Repositories\Products;

use App\Domain\Products\DTOs\ProductData;
use App\Domain\Products\Repositories\ProductRepositoryInterface;
use App\Models\Product;
use Illuminate\Pagination\LengthAwarePaginator;

class EloquentProductRepository implements ProductRepositoryInterface
{
    public function paginate(int $tenantId, int $perPage): LengthAwarePaginator
    {
        return Product::where('tenant_id', $tenantId)
            ->with('category')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->paginate($perPage);
    }

    public function findByUlid(int $tenantId, string $ulid): Product
    {
        return Product::where('tenant_id', $tenantId)
            ->where('ulid', $ulid)
            ->with('category')
            ->firstOrFail();
    }

    public function create(int $tenantId, ProductData $data): Product
    {
        return Product::create([
            'tenant_id'   => $tenantId,
            'category_id' => $data->categoryId,
            'name'        => $data->name,
            'slug'        => $data->slug,
            'description' => $data->description,
            'image'       => $data->image,
            'price'       => $data->price,
            'stock'       => $data->stock,
            'is_active'   => $data->isActive,
            'sort_order'  => $data->sortOrder,
        ]);
    }

    public function update(Product $product, ProductData $data): Product
    {
        $product->update([
            'category_id' => $data->categoryId,
            'name'        => $data->name,
            'slug'        => $data->slug,
            'description' => $data->description,
            'image'       => $data->image,
            'price'       => $data->price,
            'stock'       => $data->stock,
            'is_active'   => $data->isActive,
            'sort_order'  => $data->sortOrder,
        ]);

        return $product->fresh();
    }

    public function delete(Product $product): void
    {
        $product->delete();
    }
}
