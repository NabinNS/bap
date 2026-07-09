<?php

namespace App\Http\Resources\Images;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ImageGroupResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'ulid'  => $this->ulid,
            'slug'  => $this->slug,
            'name'  => $this->name,
            'items' => ImageItemResource::collection($this->whenLoaded('imageItems')),
        ];
    }
}
