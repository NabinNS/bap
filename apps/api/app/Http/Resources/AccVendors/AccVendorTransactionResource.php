<?php

namespace App\Http\Resources\AccVendors;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AccVendorTransactionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'ulid'           => $this->ulid,
            'fiscal_year_id' => $this->fiscal_year_id,
            'date'       => $this->date,
            'particular' => $this->particular,
            'voucher_no' => $this->voucher_no,
            'cheque_no'  => $this->cheque_no,
            'type'             => $this->type,
            'debit'            => $this->debit,
            'credit'           => $this->credit,
            'discount_percent' => $this->discount_percent,
            'discount_amount'  => $this->discount_amount,
            'taxable_amount'   => $this->taxable_amount,
            'vat_amount'       => $this->vat_amount,
            'grand_total'      => $this->grand_total,
            'items'            => $this->whenLoaded('items', fn() => $this->items->map(fn($item) => [
                'ulid'         => $item->ulid,
                'product_ulid' => $item->product->ulid,
                'product_name' => $item->product->name,
                'quantity'     => $item->quantity,
                'rate'         => $item->rate,
                'amount'       => $item->amount,
                'discount'     => $item->discount,
                'total'        => $item->total,
            ])),
        ];
    }
}
