<?php

namespace App\Http\Resources\ProductTransactionItems;

use App\Models\AccCustomerTransactionItem;
use App\Models\AccVendorTransactionItem;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductTransactionItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'ulid'              => $this->ulid,
            'fiscal_year_id'    => $this->fiscal_year_id,
            'date'              => $this->date,
            'type'              => $this->type,
            'payment_type'      => $this->payment_type,
            'purchase_quantity' => $this->purchase_quantity,
            'purchase_price'    => $this->purchase_price,
            'sales_quantity'    => $this->sales_quantity,
            'sales_price'       => $this->sales_price,
            'cost_price'        => $this->cost_price,
            // Profit on this sale using the wacc snapshotted at the time it happened — null for
            // purchase rows, or for a sale recorded before this snapshot existed.
            'profit'            => $this->type === 'sale' && $this->cost_price !== null
                ? ($this->sales_price - $this->cost_price) * $this->sales_quantity
                : null,
            'reference_type'    => $this->reference_type,
            // Lets the frontend deep-link straight into editing the actual bill this entry
            // came from, instead of only being able to open a blank new one.
            'bill'              => $this->resolveBill(),
        ];
    }

    private function resolveBill(): ?array
    {
        if (!$this->reference_type || !$this->reference_id) {
            return null;
        }

        if ($this->reference_type === 'acc_vendor_transaction_item') {
            $item = AccVendorTransactionItem::with(['transaction.items.product', 'vendor'])->find($this->reference_id);
            if (!$item || !$item->transaction || !$item->vendor) {
                return null;
            }

            return [
                'transaction_ulid' => $item->transaction->ulid,
                'party_ulid'       => $item->vendor->ulid,
                'party_name'       => $item->vendor->name,
                ...$this->billTotals($item->transaction),
            ];
        }

        if ($this->reference_type === 'acc_customer_transaction_item') {
            $item = AccCustomerTransactionItem::with(['transaction.items.product', 'customer'])->find($this->reference_id);
            if (!$item || !$item->transaction || !$item->customer) {
                return null;
            }

            return [
                'transaction_ulid' => $item->transaction->ulid,
                'party_ulid'       => $item->customer->ulid,
                'party_name'       => $item->customer->name,
                ...$this->billTotals($item->transaction),
            ];
        }

        return null;
    }

    /** Shared shape for the full bill's line items and totals — same fields either domain uses. */
    private function billTotals($transaction): array
    {
        return [
            'items' => $transaction->items->map(fn ($i) => [
                'product_name' => $i->product?->name ?? '—',
                'quantity'     => $i->quantity,
                'rate'         => $i->rate,
                'discount'     => $i->discount,
                'total'        => $i->total,
            ])->all(),
            'discount_percent' => $transaction->discount_percent,
            'taxable_amount'   => $transaction->taxable_amount,
            'vat_amount'       => $transaction->vat_amount,
            'grand_total'      => $transaction->grand_total,
        ];
    }
}
