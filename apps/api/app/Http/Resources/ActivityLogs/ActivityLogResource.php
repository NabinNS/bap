<?php

namespace App\Http\Resources\ActivityLogs;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ActivityLogResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'ulid'        => $this->ulid,
            'event'       => $this->event,
            'description' => $this->description,
            'changes'     => $this->changes,
            'user'        => $this->whenLoaded('user', fn () => $this->user?->name),
            'created_at'  => $this->created_at,
        ];
    }
}
