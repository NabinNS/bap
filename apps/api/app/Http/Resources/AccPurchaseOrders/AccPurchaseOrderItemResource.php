<?php

namespace App\Http\Resources\AccPurchaseOrders;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AccPurchaseOrderItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'ulid'         => $this->ulid,
            'product_ulid' => $this->product->ulid,
            'product_name' => $this->product->name,
            'quantity'     => $this->quantity,
            'rate'         => $this->rate !== null ? (float) $this->rate : null,
        ];
    }
}
