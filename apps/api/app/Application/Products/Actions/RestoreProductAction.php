<?php

namespace App\Application\Products\Actions;

use App\Domain\Products\Repositories\ProductRepositoryInterface;
use App\Models\Product;

class RestoreProductAction
{
    public function __construct(
        private ProductRepositoryInterface $products,
    ) {}

    public function execute(int $tenantId, string $ulid): Product
    {
        return $this->products->restore($tenantId, $ulid);
    }
}
