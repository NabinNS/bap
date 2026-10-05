<?php

namespace App\Http\Resources\AccQuotations;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AccQuotationItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'ulid'         => $this->ulid,
            'product_ulid' => $this->product->ulid,
            'product_name' => $this->product->name,
            'quantity'     => $this->quantity,
            'rate'         => $this->rate,
            'amount'       => $this->amount,
            'discount'     => $this->discount,
            'total'        => $this->total,
        ];
    }
}
