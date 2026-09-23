<?php

namespace App\Application\AccVendors\Actions;

use App\Application\ProductTransactionItems\Actions\RestoreProductTransactionItemAction;
use App\Domain\AccVendors\Repositories\AccVendorTransactionRepositoryInterface;
use App\Domain\ProductTransactionItems\Repositories\ProductTransactionItemRepositoryInterface;
use App\Domain\Products\Repositories\ProductRepositoryInterface;
use App\Models\AccVendor;
use App\Models\AccVendorTransaction;
use App\Models\AccVendorTransactionItem;
use Illuminate\Support\Facades\DB;

class RestoreAccVendorTransactionItemAction
{
    public function __construct(
        private AccVendorTransactionRepositoryInterface $transactions,
        private RecalculateAccVendorTransactionTotalsAction $recalculateTotals,
        private ProductTransactionItemRepositoryInterface $productItems,
        private ProductRepositoryInterface $products,
        private RestoreProductTransactionItemAction $restoreProductTransactionItem,
    ) {}

    /**
     * Brings one deleted line item back onto its bill, restores its linked product ledger
     * row (re-applying the stock/WACC it contributed — the inverse of what deleting it did),
     * and recomputes the bill's totals.
     */
    public function execute(int $tenantId, AccVendor $vendor, AccVendorTransaction $transaction, string $itemUlid): AccVendorTransactionItem
    {
        return DB::transaction(function () use ($tenantId, $vendor, $transaction, $itemUlid) {
            $item = $this->transactions->restoreItem($tenantId, $transaction, $itemUlid);

            $linked = $this->productItems->findByReference($tenantId, 'acc_vendor_transaction_item', $item->id);

            if ($linked && $linked->trashed()) {
                $product = $this->products->lockById($tenantId, $linked->product_id);
                $this->restoreProductTransactionItem->execute($tenantId, $product, $linked->ulid);
            }

            $this->recalculateTotals->execute($vendor, $transaction);

            return $item;
        });
    }
}
