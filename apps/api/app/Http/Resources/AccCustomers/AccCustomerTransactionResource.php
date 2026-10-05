<?php

namespace App\Http\Resources\AccCustomers;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AccCustomerTransactionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'ulid'           => $this->ulid,
            'fiscal_year_id' => $this->fiscal_year_id,
            'customer'       => $this->whenLoaded('customer', fn () => [
                'ulid'    => $this->customer->ulid,
                'name'    => $this->customer->name,
                'address' => $this->customer->address,
                'vat_no'  => $this->customer->vat_no,
            ]),
            'date'       => $this->date,
            'particular' => $this->particular,
            'voucher_no' => $this->voucher_no,
            'cheque_no'  => $this->cheque_no,
            'payment_type'     => $this->type,
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
