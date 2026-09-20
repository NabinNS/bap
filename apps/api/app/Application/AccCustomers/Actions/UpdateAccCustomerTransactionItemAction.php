<?php

namespace App\Application\AccCustomers\Actions;

use App\Domain\AccCustomers\DTOs\AccCustomerTransactionItemData;
use App\Domain\AccCustomers\Repositories\AccCustomerTransactionRepositoryInterface;
use App\Domain\Products\Repositories\ProductRepositoryInterface;
use App\Models\AccCustomer;
use App\Models\AccCustomerTransaction;
use App\Models\AccCustomerTransactionItem;
use Illuminate\Support\Facades\DB;

class UpdateAccCustomerTransactionItemAction
{
    public function __construct(
        private AccCustomerTransactionRepositoryInterface $transactions,
        private ProductRepositoryInterface $products,
        private ReverseAccCustomerTransactionItemStockAction $reverseItemStock,
        private RecalculateAccCustomerTransactionTotalsAction $recalculateTotals,
    ) {}

    public function execute(
        int $tenantId,
        AccCustomer $customer,
        AccCustomerTransaction $transaction,
        AccCustomerTransactionItem $item,
        AccCustomerTransactionItemData $data
    ): AccCustomerTransactionItem {
        return DB::transaction(function () use ($tenantId, $customer, $transaction, $item, $data) {
            $item = $this->transactions->lockItemForUpdate($item);

            // Undo the old line's stock contribution first (adds it back), then decrement for
            // the new one on top — this composes correctly even when the product itself didn't change.
            $this->reverseItemStock->execute($tenantId, $item);

            $product = $this->products->lockByUlid($tenantId, $data->productUlid);

            $newStock = max(0, $product->stock - $data->quantity);
            $this->products->updateStockAndCost($product, $newStock, $product->wacc ?? 0);

            $updated = $this->transactions->updateItem($item, $product, $data);

            $this->recalculateTotals->execute($customer, $transaction);

            return $updated;
        });
    }
}
