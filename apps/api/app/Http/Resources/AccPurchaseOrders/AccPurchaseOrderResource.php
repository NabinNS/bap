<?php

namespace App\Http\Resources\AccPurchaseOrders;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AccPurchaseOrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'ulid'           => $this->ulid,
            'fiscal_year_id' => $this->fiscal_year_id,
            'vendor'         => $this->whenLoaded('vendor', fn () => [
                'ulid'    => $this->vendor->ulid,
                'name'    => $this->vendor->name,
                'address' => $this->vendor->address,
                'vat_no'  => $this->vendor->vat_no,
            ]),
            'date'       => $this->date,
            'voucher_no' => $this->voucher_no,
            'items'      => $this->whenLoaded('items', fn() => $this->items->map(fn($item) => [
                'ulid'         => $item->ulid,
                'product_ulid' => $item->product->ulid,
                'product_name' => $item->product->name,
                'quantity'     => $item->quantity,
            ])),
        ];
    }
}
