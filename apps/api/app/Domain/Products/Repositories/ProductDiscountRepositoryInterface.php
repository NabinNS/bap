<?php

namespace App\Domain\Products\Repositories;

use App\Domain\Products\DTOs\ProductDiscountData;
use App\Models\Product;
use App\Models\ProductDiscount;
use Illuminate\Database\Eloquent\Collection;

interface ProductDiscountRepositoryInterface
{
    public function allForProduct(Product $product): Collection;

    public function create(Product $product, ProductDiscountData $data): ProductDiscount;

    public function update(ProductDiscount $discount, ProductDiscountData $data): ProductDiscount;

    public function delete(ProductDiscount $discount): void;
}
