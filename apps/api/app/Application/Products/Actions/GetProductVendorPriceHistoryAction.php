<?php

namespace App\Application\Products\Actions;

use App\Models\AccVendorTransactionItem;
use App\Models\Product;
use Illuminate\Support\Collection;

class GetProductVendorPriceHistoryAction
{
    /**
     * Latest rate charged by each vendor for this product, cheapest first.
     *
     * @return Collection<int, array{vendor_id: int, vendor_ulid: string, vendor_name: string, rate: int, date: string}>
     */
    public function execute(int $tenantId, Product $product): Collection
    {
        return AccVendorTransactionItem::query()
            ->with('vendor')
            ->join('acc_vendor_transactions', 'acc_vendor_transactions.id', '=', 'acc_vendor_transaction_items.transaction_id')
            ->where('acc_vendor_transaction_items.tenant_id', $tenantId)
            ->where('acc_vendor_transaction_items.product_id', $product->id)
            ->selectRaw('DISTINCT ON (acc_vendor_transaction_items.vendor_id) acc_vendor_transaction_items.*, acc_vendor_transactions.date as transaction_date')
            ->orderBy('acc_vendor_transaction_items.vendor_id')
            ->orderByDesc('acc_vendor_transactions.date')
            ->orderByDesc('acc_vendor_transaction_items.id')
            ->get()
            ->map(fn (AccVendorTransactionItem $item) => [
                'vendor_id'   => $item->vendor_id,
                'vendor_ulid' => $item->vendor->ulid,
                'vendor_name' => $item->vendor->name,
                'rate'        => $item->rate,
                'date'        => $item->transaction_date,
            ])
            ->sortBy('rate')
            ->values();
    }
}
