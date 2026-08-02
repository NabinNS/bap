<?php

namespace App\Application\Products\Actions;

use App\Domain\Products\Repositories\ProductDiscountRepositoryInterface;
use App\Models\ProductDiscount;

class DeleteProductDiscountAction
{
    public function __construct(
        private ProductDiscountRepositoryInterface $discounts,
    ) {}

    public function execute(ProductDiscount $discount): void
    {
        $this->discounts->delete($discount);
    }
}
