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
            'stock'              => $this->stock,
            'low_stock_quantity' => $this->low_stock_quantity,
            'is_low_stock'       => $this->low_stock_quantity !== null && $this->stock <= $this->low_stock_quantity,
        ];
    }
}
