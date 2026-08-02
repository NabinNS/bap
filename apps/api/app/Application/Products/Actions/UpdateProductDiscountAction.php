<?php

namespace App\Application\Products\Actions;

use App\Domain\Products\DTOs\ProductDiscountData;
use App\Domain\Products\Repositories\ProductDiscountRepositoryInterface;
use App\Models\ProductDiscount;

class UpdateProductDiscountAction
{
    public function __construct(
        private ProductDiscountRepositoryInterface $discounts,
    ) {}

    public function execute(ProductDiscount $discount, ProductDiscountData $data): ProductDiscount
    {
        return $this->discounts->update($discount, $data);
    }
}
