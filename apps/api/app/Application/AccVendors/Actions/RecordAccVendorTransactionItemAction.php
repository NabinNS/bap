<?php

namespace App\Application\AccVendors\Actions;

use App\Models\AccVendor;
use App\Models\AccVendorTransaction;
use App\Models\AccVendorTransactionItem;
use App\Models\Product;
use Illuminate\Support\Facades\DB;

class RecordAccVendorTransactionItemAction
{
    public function __construct(
        private RecalculateAccVendorTransactionTotalsAction $recalculateTotals,
    ) {}

    /**
     * Create one transaction line item (with its own per-row discount), roll the purchase into
     * the product's stock/cost_price via weighted average cost, then recompute the bill's
     * overall discount/VAT breakdown from the resulting line totals.
     */
    public function execute(int $tenantId, AccVendor $vendor, AccVendorTransaction $transaction, array $item): AccVendorTransactionItem
    {
        return DB::transaction(function () use ($tenantId, $vendor, $transaction, $item) {
            /** @var Product $product */
            $product = Product::where('tenant_id', $tenantId)
                ->where('ulid', $item['product_ulid'])
                ->lockForUpdate()
                ->firstOrFail();

            $quantity = (int) $item['quantity'];
            $rate     = (int) $item['rate'];
            $amount   = $quantity * $rate;
            $discount = (int) ($item['discount'] ?? 0);
            $total    = max(0, $amount - $discount);

            $transactionItem = $transaction->items()->create([
                'tenant_id'  => $tenantId,
                'vendor_id'  => $vendor->id,
                'product_id' => $product->id,
                'quantity'   => $quantity,
                'rate'       => $rate,
                'amount'     => $amount,
                'discount'   => $discount,
                'total'      => $total,
            ]);

            // Weighted average cost: blend the new purchase into existing stock
            // instead of overwriting cost_price with the latest purchase rate.
            $currentStock = $product->stock;
            $currentCost  = $product->cost_price ?? $rate;
            $newStock     = $currentStock + $quantity;

            $newCost = $newStock > 0
                ? (int) round((($currentStock * $currentCost) + ($quantity * $rate)) / $newStock)
                : $rate;

            $product->update([
                'stock'      => $newStock,
                'cost_price' => $newCost,
            ]);

            $this->recalculateTotals->execute($transaction);

            return $transactionItem;
        });
    }
}
