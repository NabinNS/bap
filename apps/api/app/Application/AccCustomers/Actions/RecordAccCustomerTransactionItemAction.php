<?php

namespace App\Application\AccCustomers\Actions;

use App\Domain\AccCustomers\DTOs\AccCustomerTransactionItemData;
use App\Domain\AccCustomers\Repositories\AccCustomerTransactionRepositoryInterface;
use App\Domain\Products\Repositories\ProductRepositoryInterface;
use App\Models\AccCustomer;
use App\Models\AccCustomerTransaction;
use App\Models\AccCustomerTransactionItem;
use Illuminate\Support\Facades\DB;

class RecordAccCustomerTransactionItemAction
{
    public function __construct(
        private AccCustomerTransactionRepositoryInterface $transactions,
        private ProductRepositoryInterface $products,
        private RecalculateAccCustomerTransactionTotalsAction $recalculateTotals,
    ) {}

    /**
     * Create one transaction line item (with its own per-row discount), decrement the product's
     * stock for the sale (leaving cost/wacc untouched — a sale doesn't change what the product
     * cost to acquire), then recompute the bill's overall discount/VAT breakdown from the
     * resulting line totals.
     */
    public function execute(int $tenantId, AccCustomer $customer, AccCustomerTransaction $transaction, AccCustomerTransactionItemData $item): AccCustomerTransactionItem
    {
        return DB::transaction(function () use ($tenantId, $customer, $transaction, $item) {
            $product = $this->products->lockByUlid($tenantId, $item->productUlid);

            $transactionItem = $this->transactions->createItem($tenantId, $customer, $transaction, $product, $item);

            // Sale reduces stock only; wacc (cost) is left untouched, unlike a purchase which
            // blends the new cost in via weighted average.
            $newStock = max(0, $product->stock - $item->quantity);
            $this->products->updateStockAndCost($product, $newStock, $product->wacc ?? 0);

            $this->recalculateTotals->execute($customer, $transaction);

            return $transactionItem;
        });
    }
}
