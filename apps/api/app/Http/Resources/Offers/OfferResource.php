<?php

namespace App\Http\Resources\Offers;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OfferResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'ulid'       => $this->ulid,
            'title'      => $this->title,
            'sub_title'  => $this->sub_title,
            'thumbnail'  => $this->whenLoaded('imageGroups', fn() =>
                $this->imageGroups->first()?->imageItems->first()?->url
            ),
            'is_active'  => $this->is_active,
            'sort_order' => $this->sort_order,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
