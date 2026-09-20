<?php

namespace App\Http\Resources\ProductStockBalances;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductStockBalanceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'product_id'         => $this->product->ulid,
            'fiscal_year_id'     => $this->fiscal_year_id,
            'opening_quantity'   => $this->opening_quantity,
            'remaining_quantity' => $this->remaining_quantity,
        ];
    }
}
