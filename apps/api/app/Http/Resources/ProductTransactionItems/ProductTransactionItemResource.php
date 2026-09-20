<?php

namespace App\Http\Resources\ProductTransactionItems;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductTransactionItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'ulid'              => $this->ulid,
            'fiscal_year_id'    => $this->fiscal_year_id,
            'date'              => $this->date,
            'type'              => $this->type,
            'purchase_quantity' => $this->purchase_quantity,
            'purchase_price'    => $this->purchase_price,
            'sales_quantity'    => $this->sales_quantity,
            'sales_price'       => $this->sales_price,
            'reference_type'    => $this->reference_type,
        ];
    }
}
