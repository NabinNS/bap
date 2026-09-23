<?php

namespace App\Application\AccVendors\Actions;

use App\Application\ProductTransactionItems\Actions\CreateProductTransactionItemAction;
use App\Domain\AccVendors\DTOs\AccVendorTransactionItemData;
use App\Domain\AccVendors\Repositories\AccVendorTransactionRepositoryInterface;
use App\Domain\ProductTransactionItems\DTOs\ProductTransactionItemData;
use App\Domain\Products\Repositories\ProductRepositoryInterface;
use App\Models\AccVendor;
use App\Models\AccVendorTransaction;
use App\Models\AccVendorTransactionItem;
use Illuminate\Support\Facades\DB;

class RecordAccVendorTransactionItemAction
{
    public function __construct(
        private AccVendorTransactionRepositoryInterface $transactions,
        private ProductRepositoryInterface $products,
        private RecalculateAccVendorTransactionTotalsAction $recalculateTotals,
        private CreateProductTransactionItemAction $createProductTransactionItem,
    ) {}

    /**
     * Create one transaction line item (with its own per-row discount), roll the purchase into
     * the product's stock/cost_price (via the product ledger, which owns the weighted-average
     * cost blend), then recompute the bill's overall discount/VAT breakdown from the resulting
     * line totals.
     */
    public function execute(int $tenantId, AccVendor $vendor, AccVendorTransaction $transaction, AccVendorTransactionItemData $item): AccVendorTransactionItem
    {
        return DB::transaction(function () use ($tenantId, $vendor, $transaction, $item) {
            $product = $this->products->lockByUlid($tenantId, $item->productUlid);

            $transactionItem = $this->transactions->createItem($tenantId, $vendor, $transaction, $product, $item);

            $this->createProductTransactionItem->execute($tenantId, $product, new ProductTransactionItemData(
                fiscalYearId:     $transaction->fiscal_year_id,
                date:             $transaction->date,
                type:             'purchase',
                purchaseQuantity: $item->quantity,
                purchasePrice:    $item->rate,
                salesQuantity:    null,
                salesPrice:       null,
                referenceType:    'acc_vendor_transaction_item',
                referenceId:      $transactionItem->id,
            ));

            $this->recalculateTotals->execute($vendor, $transaction);

            return $transactionItem;
        });
    }
}
