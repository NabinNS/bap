<?php

namespace App\Http\Resources\AccVendors;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AccVendorTransactionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'ulid'       => $this->ulid,
            'date'       => $this->date,
            'particular' => $this->particular,
            'voucher_no' => $this->voucher_no,
            'type'             => $this->type,
            'debit'            => $this->debit,
            'credit'           => $this->credit,
            'discount_percent' => $this->discount_percent,
            'taxable_amount'   => $this->taxable_amount,
            'vat_amount'       => $this->vat_amount,
            'grand_total'      => $this->grand_total,
        ];
    }
}
