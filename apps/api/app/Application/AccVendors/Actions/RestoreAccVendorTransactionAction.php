<?php

namespace App\Application\AccVendors\Actions;

use App\Application\ProductTransactionItems\Actions\RestoreProductTransactionItemAction;
use App\Domain\AccVendors\Repositories\AccVendorTransactionRepositoryInterface;
use App\Domain\ProductTransactionItems\Repositories\ProductTransactionItemRepositoryInterface;
use App\Domain\Products\Repositories\ProductRepositoryInterface;
use App\Models\AccVendor;
use App\Models\AccVendorTransaction;
use Illuminate\Support\Facades\DB;

class RestoreAccVendorTransactionAction
{
    public function __construct(
        private AccVendorTransactionRepositoryInterface $transactions,
        private RecalculateVendorBalanceAction $recalculateBalance,
        private ProductTransactionItemRepositoryInterface $productItems,
        private ProductRepositoryInterface $products,
        private RestoreProductTransactionItemAction $restoreProductTransactionItem,
    ) {}

    /**
     * Brings the transaction back into the ledger, restores each item's linked product ledger
     * row (re-applying its stock/WACC contribution — the exact inverse of what deleting the
     * bill did), and recalculates the vendor's balance for its fiscal year.
     */
    public function execute(int $tenantId, AccVendor $vendor, string $transactionUlid): AccVendorTransaction
    {
        return DB::transaction(function () use ($tenantId, $vendor, $transactionUlid) {
            $transaction = $this->transactions->restore($tenantId, $vendor, $transactionUlid);

            foreach ($this->transactions->items($transaction) as $item) {
                $linked = $this->productItems->findByReference('acc_vendor_transaction_item', $item->id);

                if ($linked && $linked->trashed()) {
                    $product = $this->products->lockById($tenantId, $linked->product_id);
                    $this->restoreProductTransactionItem->execute($tenantId, $product, $linked->ulid);
                }
            }

            $this->recalculateBalance->execute($vendor, $transaction->fiscal_year_id);

            return $transaction;
        });
    }
}
