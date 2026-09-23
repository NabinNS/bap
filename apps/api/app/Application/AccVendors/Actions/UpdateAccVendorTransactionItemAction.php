<?php

namespace App\Application\AccVendors\Actions;

use App\Application\ProductTransactionItems\Actions\CreateProductTransactionItemAction;
use App\Application\ProductTransactionItems\Actions\DeleteProductTransactionItemAction;
use App\Application\ProductTransactionItems\Actions\UpdateProductTransactionItemAction;
use App\Domain\AccVendors\DTOs\AccVendorTransactionItemData;
use App\Domain\AccVendors\Repositories\AccVendorTransactionRepositoryInterface;
use App\Domain\ProductTransactionItems\DTOs\ProductTransactionItemData;
use App\Domain\ProductTransactionItems\Repositories\ProductTransactionItemRepositoryInterface;
use App\Domain\Products\Repositories\ProductRepositoryInterface;
use App\Models\AccVendor;
use App\Models\AccVendorTransaction;
use App\Models\AccVendorTransactionItem;
use Illuminate\Support\Facades\DB;

class UpdateAccVendorTransactionItemAction
{
    public function __construct(
        private AccVendorTransactionRepositoryInterface $transactions,
        private ProductRepositoryInterface $products,
        private RecalculateAccVendorTransactionTotalsAction $recalculateTotals,
        private ProductTransactionItemRepositoryInterface $productItems,
        private CreateProductTransactionItemAction $createProductTransactionItem,
        private UpdateProductTransactionItemAction $updateProductTransactionItem,
        private DeleteProductTransactionItemAction $deleteProductTransactionItem,
    ) {}

    public function execute(
        int $tenantId,
        AccVendor $vendor,
        AccVendorTransaction $transaction,
        AccVendorTransactionItem $item,
        AccVendorTransactionItemData $data
    ): AccVendorTransactionItem {
        return DB::transaction(function () use ($tenantId, $vendor, $transaction, $item, $data) {
            $item = $this->transactions->lockItemForUpdate($item);

            $product = $this->products->lockByUlid($tenantId, $data->productUlid);

            $updated = $this->transactions->updateItem($item, $product, $data);

            $this->syncProductLedger($tenantId, $item, $product, $transaction, $data);

            $this->recalculateTotals->execute($vendor, $transaction);

            return $updated;
        });
    }

    /**
     * Mirror the updated bill line back into the product's own stock ledger, which owns the
     * stock/wacc math. If the line was never linked (predates this feature), there's nothing to
     * sync. If the product changed, the old ledger row belongs to the old product and can't be
     * "moved" — delete it there and create a fresh one on the new product instead.
     */
    private function syncProductLedger(
        int $tenantId,
        AccVendorTransactionItem $item,
        $product,
        AccVendorTransaction $transaction,
        AccVendorTransactionItemData $data
    ): void {
        $linked = $this->productItems->findByReference('acc_vendor_transaction_item', $item->id);

        if (!$linked) {
            return;
        }

        $newData = new ProductTransactionItemData(
            fiscalYearId:     $transaction->fiscal_year_id,
            date:             $transaction->date,
            type:             'purchase',
            purchaseQuantity: $data->quantity,
            purchasePrice:    $data->rate,
            salesQuantity:    null,
            salesPrice:       null,
            referenceType:    'acc_vendor_transaction_item',
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
