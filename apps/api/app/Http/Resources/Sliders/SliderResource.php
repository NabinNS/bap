<?php

namespace App\Http\Resources\Sliders;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SliderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'ulid'          => $this->ulid,
            'name'          => $this->name,
            'thumbnail'     => $this->whenLoaded('imageGroups', fn() =>
                $this->imageGroups->first()?->imageItems->first()?->url
            ),
            'is_active'     => $this->is_active,
            'sort_order'    => $this->sort_order,
            'deadline_date' => $this->deadline_date,
            'created_at'    => $this->created_at,
            'updated_at'    => $this->updated_at,
        ];
    }
}
