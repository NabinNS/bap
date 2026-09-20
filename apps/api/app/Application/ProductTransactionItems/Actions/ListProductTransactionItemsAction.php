<?php

namespace App\Application\ProductTransactionItems\Actions;

use App\Domain\ProductTransactionItems\Repositories\ProductTransactionItemRepositoryInterface;
use App\Models\Product;
use Illuminate\Pagination\LengthAwarePaginator;

class ListProductTransactionItemsAction
{
    public function __construct(
        private ProductTransactionItemRepositoryInterface $items,
    ) {}

    public function execute(Product $product, int $perPage): LengthAwarePaginator
    {
        return $this->items->paginate($product, $perPage);
    }
}
