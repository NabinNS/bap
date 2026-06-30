<?php

namespace App\Application\Products\Actions;

use App\Domain\Products\Repositories\ProductRepositoryInterface;
use App\Models\Product;

class ShowProductAction
{
    public function __construct(
        private ProductRepositoryInterface $products,
    ) {}

    public function execute(int $tenantId, string $ulid): Product
    {
        return $this->products->findByUlid($tenantId, $ulid);
    }
}
