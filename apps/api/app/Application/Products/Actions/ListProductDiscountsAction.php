<?php

namespace App\Application\Products\Actions;

use App\Domain\Products\Repositories\ProductDiscountRepositoryInterface;
use App\Models\Product;
use Illuminate\Database\Eloquent\Collection;

class ListProductDiscountsAction
{
    public function __construct(
        private ProductDiscountRepositoryInterface $discounts,
    ) {}

    public function execute(Product $product): Collection
    {
        return $this->discounts->allForProduct($product);
    }
}
