<?php

namespace App\Http\Resources\Products;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductLiteResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'ulid'        => $this->ulid,
            'name'        => $this->name,
            'sku'         => $this->sku,
            'cost_price'  => $this->cost_price,
            'wacc'        => $this->wacc,
            'sales_price' => $this->sales_price,
        ];
    }
}
