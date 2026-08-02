<?php

namespace App\Http\Resources\Products;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductDiscountResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'ulid'       => $this->ulid,
            'percentage' => $this->percentage,
            'starts_at'  => $this->starts_at?->toDateString(),
            'ends_at'    => $this->ends_at?->toDateString(),
            'is_active'  => $this->is_active,
            'created_at' => $this->created_at,
        ];
    }
}
