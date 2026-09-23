<?php

namespace App\Application\AccCustomers\Actions;

use App\Application\ProductTransactionItems\Actions\CreateProductTransactionItemAction;
use App\Domain\AccCustomers\DTOs\AccCustomerTransactionItemData;
use App\Domain\AccCustomers\Repositories\AccCustomerTransactionRepositoryInterface;
use App\Domain\ProductTransactionItems\DTOs\ProductTransactionItemData;
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
        private CreateProductTransactionItemAction $createProductTransactionItem,
    ) {}

    /**
     * Create one transaction line item (with its own per-row discount), decrement the product's
     * stock for the sale via the product ledger (leaving cost/wacc untouched — a sale doesn't
     * change what the product cost to acquire), then recompute the bill's overall discount/VAT
     * breakdown from the resulting line totals.
     */
    public function execute(int $tenantId, AccCustomer $customer, AccCustomerTransaction $transaction, AccCustomerTransactionItemData $item): AccCustomerTransactionItem
    {
        return DB::transaction(function () use ($tenantId, $customer, $transaction, $item) {
            $product = $this->products->lockByUlid($tenantId, $item->productUlid);

            $transactionItem = $this->transactions->createItem($tenantId, $customer, $transaction, $product, $item);

            $this->createProductTransactionItem->execute($tenantId, $product, new ProductTransactionItemData(
                fiscalYearId:     $transaction->fiscal_year_id,
                date:             $transaction->date,
                type:             'sale',
                purchaseQuantity: null,
                purchasePrice:    null,
                salesQuantity:    $item->quantity,
                salesPrice:       $item->rate,
                referenceType:    'acc_customer_transaction_item',
                referenceId:      $transactionItem->id,
            ));

            $this->recalculateTotals->execute($customer, $transaction);

            return $transactionItem;
        });
    }
}
