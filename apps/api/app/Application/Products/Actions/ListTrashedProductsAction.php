<?php

namespace App\Application\Products\Actions;

use App\Domain\Products\Repositories\ProductRepositoryInterface;
use Illuminate\Support\Collection;

class ListTrashedProductsAction
{
    public function __construct(
        private ProductRepositoryInterface $products,
    ) {}

    public function execute(int $tenantId): Collection
    {
        return $this->products->trashed($tenantId);
    }
}
