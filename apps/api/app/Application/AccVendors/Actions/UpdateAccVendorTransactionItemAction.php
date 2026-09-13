<?php

namespace App\Application\AccVendors\Actions;

use App\Domain\AccVendors\DTOs\AccVendorTransactionItemData;
use App\Domain\AccVendors\Repositories\AccVendorTransactionRepositoryInterface;
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
        private ReverseAccVendorTransactionItemStockAction $reverseItemStock,
        private RecalculateAccVendorTransactionTotalsAction $recalculateTotals,
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

            // Undo the old line's stock/wacc contribution first, then blend in the new one on top —
            // this composes correctly even when the product itself didn't change.
            $this->reverseItemStock->execute($tenantId, $item);

            $product = $this->products->lockByUlid($tenantId, $data->productUlid);

            $currentStock = $product->stock;
            $currentCost  = $product->wacc ?? $data->rate;
            $newStock     = $currentStock + $data->quantity;
            $newWacc      = $newStock > 0
                ? (int) round((($currentStock * $currentCost) + ($data->quantity * $data->rate)) / $newStock)
                : $data->rate;

            $this->products->updateStockAndCost($product, $newStock, $newWacc);

            $updated = $this->transactions->updateItem($item, $product, $data);

            $this->recalculateTotals->execute($vendor, $transaction);

            return $updated;
        });
    }
}
