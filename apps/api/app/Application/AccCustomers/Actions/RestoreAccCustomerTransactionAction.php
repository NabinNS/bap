<?php

namespace App\Application\AccCustomers\Actions;

use App\Application\ProductTransactionItems\Actions\RestoreProductTransactionItemAction;
use App\Domain\AccCustomers\Repositories\AccCustomerTransactionRepositoryInterface;
use App\Domain\ProductTransactionItems\Repositories\ProductTransactionItemRepositoryInterface;
use App\Domain\Products\Repositories\ProductRepositoryInterface;
use App\Models\AccCustomer;
use App\Models\AccCustomerTransaction;
use Illuminate\Support\Facades\DB;

class RestoreAccCustomerTransactionAction
{
    public function __construct(
        private AccCustomerTransactionRepositoryInterface $transactions,
        private RecalculateCustomerBalanceAction $recalculateBalance,
        private ProductTransactionItemRepositoryInterface $productItems,
        private ProductRepositoryInterface $products,
        private RestoreProductTransactionItemAction $restoreProductTransactionItem,
    ) {}

    /**
     * Brings the transaction back into the ledger, restores each item's linked product ledger
     * row (re-applying the stock it decremented — the exact inverse of what deleting the bill
     * did), and recalculates the customer's balance for its fiscal year.
     */
    public function execute(int $tenantId, AccCustomer $customer, string $transactionUlid): AccCustomerTransaction
    {
        return DB::transaction(function () use ($tenantId, $customer, $transactionUlid) {
            $transaction = $this->transactions->restore($tenantId, $customer, $transactionUlid);

            foreach ($this->transactions->items($transaction) as $item) {
                $linked = $this->productItems->findByReference($tenantId, 'acc_customer_transaction_item', $item->id);

                if ($linked && $linked->trashed()) {
                    $product = $this->products->lockById($tenantId, $linked->product_id);
                    $this->restoreProductTransactionItem->execute($tenantId, $product, $linked->ulid);
                }
            }

            $this->recalculateBalance->execute($customer, $transaction->fiscal_year_id);

            return $transaction;
        });
    }
}
