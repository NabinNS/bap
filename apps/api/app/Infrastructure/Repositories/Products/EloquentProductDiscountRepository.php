<?php

namespace App\Infrastructure\Repositories\Products;

use App\Domain\Products\DTOs\ProductDiscountData;
use App\Domain\Products\Repositories\ProductDiscountRepositoryInterface;
use App\Models\Product;
use App\Models\ProductDiscount;
use Illuminate\Database\Eloquent\Collection;

class EloquentProductDiscountRepository implements ProductDiscountRepositoryInterface
{
    public function allForProduct(Product $product): Collection
    {
        return $product->discounts()->latest()->get();
    }

    public function create(Product $product, ProductDiscountData $data): ProductDiscount
    {
        if ($data->isActive) {
            $product->discounts()->update(['is_active' => false]);
        }

        return $product->discounts()->create([
            'tenant_id'  => $product->tenant_id,
            'percentage' => $data->percentage,
            'starts_at'  => $data->startsAt,
            'ends_at'    => $data->endsAt,
            'is_active'  => $data->isActive,
        ]);
    }

    public function update(ProductDiscount $discount, ProductDiscountData $data): ProductDiscount
    {
        if ($data->isActive) {
            $discount->product->discounts()
                ->where('id', '!=', $discount->id)
                ->update(['is_active' => false]);
        }

        $discount->update([
            'percentage' => $data->percentage,
            'starts_at'  => $data->startsAt,
            'ends_at'    => $data->endsAt,
            'is_active'  => $data->isActive,
        ]);

        return $discount->fresh();
    }

    public function delete(ProductDiscount $discount): void
    {
        $discount->delete();
    }
}
