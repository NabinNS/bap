<?php

namespace App\Http\Resources\Images;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ImageItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'ulid'       => $this->ulid,
            'url'        => $this->url,
            'path'       => $this->path,
            'sort_order' => $this->sort_order,
        ];
    }
}
