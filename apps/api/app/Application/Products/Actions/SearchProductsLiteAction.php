<?php

namespace App\Application\Products\Actions;

use App\Domain\Products\Repositories\ProductRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class SearchProductsLiteAction
{
    public function __construct(
        private ProductRepositoryInterface $products,
    ) {}

    public function execute(int $tenantId, ?string $search, int $limit = 5): Collection
    {
        return $this->products->searchLite($tenantId, $search, $limit);
    }
}
