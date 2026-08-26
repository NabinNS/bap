<?php

namespace App\Http\Resources\AccVendors;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AccVendorTransactionItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'ulid'          => $this->ulid,
            'transaction'   => [
                'ulid'             => $this->transaction->ulid,
                'debit'            => $this->transaction->debit,
                'discount_percent' => $this->transaction->discount_percent,
                'discount_amount'  => $this->transaction->discount_amount,
                'taxable_amount'   => $this->transaction->taxable_amount,
                'vat_amount'       => $this->transaction->vat_amount,
                'grand_total'      => $this->transaction->grand_total,
            ],
            'product_ulid'  => $this->product->ulid,
            'quantity'      => $this->quantity,
            'rate'          => $this->rate,
            'amount'        => $this->amount,
            'discount'      => $this->discount,
            'total'         => $this->total,
        ];
    }
}
