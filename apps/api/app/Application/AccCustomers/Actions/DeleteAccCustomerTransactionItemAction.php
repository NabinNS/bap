<?php

namespace App\Application\AccCustomers\Actions;

use App\Application\ProductTransactionItems\Actions\DeleteProductTransactionItemAction;
use App\Domain\AccCustomers\Repositories\AccCustomerTransactionRepositoryInterface;
use App\Domain\ProductTransactionItems\Repositories\ProductTransactionItemRepositoryInterface;
use App\Domain\Products\Repositories\ProductRepositoryInterface;
use App\Models\AccCustomer;
use App\Models\AccCustomerTransaction;
use App\Models\AccCustomerTransactionItem;
use Illuminate\Support\Facades\DB;

class DeleteAccCustomerTransactionItemAction
{
    public function __construct(
        private AccCustomerTransactionRepositoryInterface $transactions,
        private RecalculateAccCustomerTransactionTotalsAction $recalculateTotals,
        private RecalculateCustomerBalanceAction $recalculateBalance,
        private ProductTransactionItemRepositoryInterface $productItems,
        private ProductRepositoryInterface $products,
        private DeleteProductTransactionItemAction $deleteProductTransactionItem,
    ) {}

    /**
     * Deleting the last remaining item leaves nothing for the totals recalculation to derive a
     * bill from — removes the whole (now-empty) transaction instead, per product decision.
     */
    public function execute(int $tenantId, AccCustomer $customer, AccCustomerTransaction $transaction, AccCustomerTransactionItem $item): void
    {
        DB::transaction(function () use ($tenantId, $customer, $transaction, $item) {
            $item = $this->transactions->lockItemForUpdate($item);

            $linked = $this->productItems->findByReference($tenantId, 'acc_customer_transaction_item', $item->id);

            if ($linked) {
                $product = $this->products->lockById($tenantId, $linked->product_id);
                $this->deleteProductTransactionItem->execute($tenantId, $product, $linked);
            }

            $fiscalYearId = $transaction->fiscal_year_id;
            $this->transactions->deleteItem($item);

            if ($this->transactions->itemsCount($transaction) === 0) {
                $this->transactions->delete($transaction);
                $this->recalculateBalance->execute($customer, $fiscalYearId);
                return;
            }

            $this->recalculateTotals->execute($customer, $transaction);
        });
    }
}
