<?php

namespace App\Application\Products\Actions;

use App\Domain\Products\Repositories\ProductRepositoryInterface;
use Illuminate\Pagination\LengthAwarePaginator;

class ListProductsAction
{
    public function __construct(
        private ProductRepositoryInterface $products,
    ) {}

    public function execute(int $tenantId, int $perPage = 15): LengthAwarePaginator
    {
        return $this->products->paginate($tenantId, $perPage);
    }
}
