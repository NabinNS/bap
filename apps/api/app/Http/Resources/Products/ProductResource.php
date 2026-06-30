<?php

namespace App\Http\Resources\Products;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'ulid'        => $this->ulid,
            'name'        => $this->name,
            'slug'        => $this->slug,
            'description' => $this->description,
            'image'       => $this->image,
            'price'       => $this->price,
            'stock'       => $this->stock,
            'is_active'   => $this->is_active,
            'sort_order'  => $this->sort_order,
            'created_at'  => $this->created_at,
            'updated_at'  => $this->updated_at,
            'category'    => $this->whenLoaded('category', fn() => [
                'ulid' => $this->category->ulid,
                'name' => $this->category->name,
            ]),
        ];
    }
}
