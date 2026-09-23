<?php

namespace App\Application\AccCustomers\Actions;

use App\Application\ProductTransactionItems\Actions\RestoreProductTransactionItemAction;
use App\Domain\AccCustomers\Repositories\AccCustomerTransactionRepositoryInterface;
use App\Domain\ProductTransactionItems\Repositories\ProductTransactionItemRepositoryInterface;
use App\Domain\Products\Repositories\ProductRepositoryInterface;
use App\Models\AccCustomer;
use App\Models\AccCustomerTransaction;
use App\Models\AccCustomerTransactionItem;
use Illuminate\Support\Facades\DB;

class RestoreAccCustomerTransactionItemAction
{
    public function __construct(
        private AccCustomerTransactionRepositoryInterface $transactions,
        private RecalculateAccCustomerTransactionTotalsAction $recalculateTotals,
        private ProductTransactionItemRepositoryInterface $productItems,
        private ProductRepositoryInterface $products,
        private RestoreProductTransactionItemAction $restoreProductTransactionItem,
    ) {}

    /**
     * Brings one deleted line item back onto its bill, restores its linked product ledger
     * row (re-applying the stock it contributed — the inverse of what deleting it did), and
     * recomputes the bill's totals.
     */
    public function execute(int $tenantId, AccCustomer $customer, AccCustomerTransaction $transaction, string $itemUlid): AccCustomerTransactionItem
    {
        return DB::transaction(function () use ($tenantId, $customer, $transaction, $itemUlid) {
            $item = $this->transactions->restoreItem($tenantId, $transaction, $itemUlid);

            $linked = $this->productItems->findByReference('acc_customer_transaction_item', $item->id);

            if ($linked && $linked->trashed()) {
                $product = $this->products->lockById($tenantId, $linked->product_id);
                $this->restoreProductTransactionItem->execute($tenantId, $product, $linked->ulid);
            }

            $this->recalculateTotals->execute($customer, $transaction);

            return $item;
        });
    }
}
