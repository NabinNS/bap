<?php

namespace App\Application\AccVendors\Actions;

use App\Domain\AccVendors\DTOs\AccVendorTransactionItemData;
use App\Domain\AccVendors\Repositories\AccVendorTransactionRepositoryInterface;
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
    ) {}

    /**
     * Create one transaction line item (with its own per-row discount), roll the purchase into
     * the product's stock/cost_price via weighted average cost, then recompute the bill's
     * overall discount/VAT breakdown from the resulting line totals.
     */
    public function execute(int $tenantId, AccVendor $vendor, AccVendorTransaction $transaction, AccVendorTransactionItemData $item): AccVendorTransactionItem
    {
        return DB::transaction(function () use ($tenantId, $vendor, $transaction, $item) {
            $product = $this->products->lockByUlid($tenantId, $item->productUlid);

            $transactionItem = $this->transactions->createItem($tenantId, $vendor, $transaction, $product, $item);

            // Weighted average cost: blend the new purchase into existing stock instead of
            // overwriting it with the latest purchase rate. Stored separately from cost_price,
            // which stays a manually-entered reference cost on the product form.
            $currentStock = $product->stock;
            $currentCost  = $product->wacc ?? $item->rate;
            $newStock     = $currentStock + $item->quantity;

            $newWacc = $newStock > 0
                ? (int) round((($currentStock * $currentCost) + ($item->quantity * $item->rate)) / $newStock)
                : $item->rate;

            $this->products->updateStockAndCost($product, $newStock, $newWacc);

            $this->recalculateTotals->execute($vendor, $transaction);

            return $transactionItem;
        });
    }
}
