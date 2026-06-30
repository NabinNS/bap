<?php

namespace App\Application\Products\Actions;

use App\Domain\Products\Repositories\ProductRepositoryInterface;
use App\Models\Product;

class DeleteProductAction
{
    public function __construct(
        private ProductRepositoryInterface $products,
    ) {}

    public function execute(Product $product): void
    {
        $this->products->delete($product);
    }
}
