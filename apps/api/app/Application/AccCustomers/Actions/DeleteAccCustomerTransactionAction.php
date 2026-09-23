<?php

namespace App\Application\AccCustomers\Actions;

use App\Application\ProductTransactionItems\Actions\DeleteProductTransactionItemAction;
use App\Domain\AccCustomers\Repositories\AccCustomerTransactionRepositoryInterface;
use App\Domain\ProductTransactionItems\Repositories\ProductTransactionItemRepositoryInterface;
use App\Domain\Products\Repositories\ProductRepositoryInterface;
use App\Models\AccCustomer;
use App\Models\AccCustomerTransaction;
use Illuminate\Support\Facades\DB;

class DeleteAccCustomerTransactionAction
{
    public function __construct(
        private AccCustomerTransactionRepositoryInterface $transactions,
        private RecalculateCustomerBalanceAction $recalculateBalance,
        private ProductTransactionItemRepositoryInterface $productItems,
        private ProductRepositoryInterface $products,
        private DeleteProductTransactionItemAction $deleteProductTransactionItem,
    ) {}

    public function execute(int $tenantId, AccCustomer $customer, AccCustomerTransaction $transaction): void
    {
        DB::transaction(function () use ($tenantId, $customer, $transaction) {
            $fiscalYearId = $transaction->fiscal_year_id;

            foreach ($this->transactions->items($transaction) as $item) {
                $linked = $this->productItems->findByReference($tenantId, 'acc_customer_transaction_item', $item->id);

                if ($linked) {
                    $product = $this->products->lockById($tenantId, $linked->product_id);
                    $this->deleteProductTransactionItem->execute($tenantId, $product, $linked);
                }
            }

            $this->transactions->delete($transaction);
            $this->recalculateBalance->execute($customer, $fiscalYearId);
        });
    }
}
