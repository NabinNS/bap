<?php

namespace App\Application\AccVendors\Actions;

use App\Application\ProductTransactionItems\Actions\DeleteProductTransactionItemAction;
use App\Domain\AccVendors\Repositories\AccVendorTransactionRepositoryInterface;
use App\Domain\ProductTransactionItems\Repositories\ProductTransactionItemRepositoryInterface;
use App\Domain\Products\Repositories\ProductRepositoryInterface;
use App\Models\AccVendor;
use App\Models\AccVendorTransaction;
use Illuminate\Support\Facades\DB;

class DeleteAccVendorTransactionAction
{
    public function __construct(
        private AccVendorTransactionRepositoryInterface $transactions,
        private RecalculateVendorBalanceAction $recalculateBalance,
        private ProductTransactionItemRepositoryInterface $productItems,
        private ProductRepositoryInterface $products,
        private DeleteProductTransactionItemAction $deleteProductTransactionItem,
    ) {}

    public function execute(int $tenantId, AccVendor $vendor, AccVendorTransaction $transaction): void
    {
        DB::transaction(function () use ($tenantId, $vendor, $transaction) {
            $fiscalYearId = $transaction->fiscal_year_id;

            foreach ($this->transactions->items($transaction) as $item) {
                $linked = $this->productItems->findByReference($tenantId, 'acc_vendor_transaction_item', $item->id);

                if ($linked) {
                    $product = $this->products->lockById($tenantId, $linked->product_id);
                    $this->deleteProductTransactionItem->execute($tenantId, $product, $linked);
                }
            }

            $this->transactions->delete($transaction);
            $this->recalculateBalance->execute($vendor, $fiscalYearId);
        });
    }
}
