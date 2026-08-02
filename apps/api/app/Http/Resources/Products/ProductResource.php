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
            'sku'         => $this->sku,
            'thumbnail'   => $this->whenLoaded('imageGroups', fn() =>
                $this->imageGroups->first()?->imageItems->first()?->url
            ),
            'images'      => $this->whenLoaded('imageGroups', fn() =>
                $this->imageGroups->flatMap(fn($g) => $g->imageItems)->map(fn($i) => $i->url)->values()
            ),
            'slug'        => $this->slug,
            'description' => $this->description,
            'image'       => $this->image,
            'cost_price'         => $this->cost_price,
            'sales_price'        => $this->sales_price,
            'stock'              => $this->stock,
            'low_stock_quantity' => $this->low_stock_quantity,
            'is_active'          => $this->is_active,
            'is_featured'        => $this->is_featured,
            'sort_order'             => $this->sort_order,
            'additional_information' => $this->additional_information,
            'created_at'  => $this->created_at,
            'updated_at'  => $this->updated_at,
            'category'    => $this->whenLoaded('category', fn() => [
                'ulid' => $this->category->ulid,
                'name' => $this->category->name,
            ]),
            'brand'       => $this->whenLoaded('brand', fn() => $this->brand ? [
                'ulid' => $this->brand->ulid,
                'name' => $this->brand->name,
            ] : null),
        ];
    }
}
