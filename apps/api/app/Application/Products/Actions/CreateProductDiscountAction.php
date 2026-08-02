<?php

namespace App\Application\Products\Actions;

use App\Domain\Products\DTOs\ProductDiscountData;
use App\Domain\Products\Repositories\ProductDiscountRepositoryInterface;
use App\Models\Product;
use App\Models\ProductDiscount;

class CreateProductDiscountAction
{
    public function __construct(
        private ProductDiscountRepositoryInterface $discounts,
    ) {}

    public function execute(Product $product, ProductDiscountData $data): ProductDiscount
    {
        return $this->discounts->create($product, $data);
    }
}
