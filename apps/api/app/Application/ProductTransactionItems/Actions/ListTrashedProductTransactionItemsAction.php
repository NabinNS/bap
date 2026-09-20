<?php

namespace App\Application\ProductTransactionItems\Actions;

use App\Domain\ProductTransactionItems\Repositories\ProductTransactionItemRepositoryInterface;
use App\Models\Product;
use Illuminate\Support\Collection;

class ListTrashedProductTransactionItemsAction
{
    public function __construct(
        private ProductTransactionItemRepositoryInterface $items,
    ) {}

    public function execute(Product $product): Collection
    {
        return $this->items->trashed($product);
    }
}
