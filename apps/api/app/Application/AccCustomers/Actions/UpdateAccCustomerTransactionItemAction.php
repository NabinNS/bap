<?php

namespace App\Application\AccCustomers\Actions;

use App\Application\ProductTransactionItems\Actions\CreateProductTransactionItemAction;
use App\Application\ProductTransactionItems\Actions\DeleteProductTransactionItemAction;
use App\Application\ProductTransactionItems\Actions\UpdateProductTransactionItemAction;
use App\Domain\AccCustomers\DTOs\AccCustomerTransactionItemData;
use App\Domain\AccCustomers\Repositories\AccCustomerTransactionRepositoryInterface;
use App\Domain\ProductTransactionItems\DTOs\ProductTransactionItemData;
use App\Domain\ProductTransactionItems\Repositories\ProductTransactionItemRepositoryInterface;
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
        private RecalculateAccCustomerTransactionTotalsAction $recalculateTotals,
        private ProductTransactionItemRepositoryInterface $productItems,
        private CreateProductTransactionItemAction $createProductTransactionItem,
        private UpdateProductTransactionItemAction $updateProductTransactionItem,
        private DeleteProductTransactionItemAction $deleteProductTransactionItem,
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

            $product = $this->products->lockByUlid($tenantId, $data->productUlid);

            $updated = $this->transactions->updateItem($item, $product, $data);

            $this->syncProductLedger($tenantId, $item, $product, $transaction, $data);

            $this->recalculateTotals->execute($customer, $transaction);

            return $updated;
        });
    }

    /**
     * Mirror the updated bill line back into the product's own stock ledger, which owns the
     * stock math. If the line was never linked (predates this feature), there's nothing to sync.
     * If the product changed, the old ledger row belongs to the old product and can't be
     * "moved" — delete it there and create a fresh one on the new product instead.
     */
    private function syncProductLedger(
        int $tenantId,
        AccCustomerTransactionItem $item,
        $product,
        AccCustomerTransaction $transaction,
        AccCustomerTransactionItemData $data
    ): void {
        $linked = $this->productItems->findByReference('acc_customer_transaction_item', $item->id);

        if (!$linked) {
            return;
        }

        $newData = new ProductTransactionItemData(
            fiscalYearId:     $transaction->fiscal_year_id,
            date:             $transaction->date,
            type:             'sale',
            purchaseQuantity: null,
            purchasePrice:    null,
            salesQuantity:    $data->quantity,
            salesPrice:       $data->rate,
            referenceType:    'acc_customer_transaction_item',
            referenceId:      $item->id,
        );

        if ($linked->product_id === $product->id) {
            $this->updateProductTransactionItem->execute($tenantId, $product, $linked, $newData);

            return;
        }

        $oldProduct = $this->products->lockById($tenantId, $linked->product_id);
        $this->deleteProductTransactionItem->execute($tenantId, $oldProduct, $linked);
        $this->createProductTransactionItem->execute($tenantId, $product, $newData);
    }
}
