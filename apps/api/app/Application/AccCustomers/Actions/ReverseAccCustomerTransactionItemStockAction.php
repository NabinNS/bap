<?php

namespace App\Application\AccCustomers\Actions;

use App\Domain\Products\Repositories\ProductRepositoryInterface;
use App\Models\AccCustomerTransactionItem;

class ReverseAccCustomerTransactionItemStockAction
{
    public function __construct(
        private ProductRepositoryInterface $products,
    ) {}

    /**
     * Undo one recorded item's contribution to its product's stock — the inverse of the
     * decrement in RecordAccCustomerTransactionItemAction. A sale reversal ADDS the quantity
     * back to stock (the opposite direction of a vendor purchase reversal, which subtracts);
     * wacc/cost is left untouched since a sale never touched it either.
     */
    public function execute(int $tenantId, AccCustomerTransactionItem $item): void
    {
        $product = $this->products->lockById($tenantId, $item->product_id);

        $newStock = $product->stock + $item->quantity;

        $this->products->updateStockAndCost($product, $newStock, $product->wacc ?? 0);
    }
}
