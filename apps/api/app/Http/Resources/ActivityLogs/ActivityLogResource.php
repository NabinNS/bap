<?php

namespace App\Http\Resources\ActivityLogs;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ActivityLogResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'ulid'         => $this->ulid,
            'subject_type' => $this->subject_type,
            'subject_ulid' => $this->whenLoaded('subject', fn () => $this->subject?->ulid),
            'session_id'   => $this->session_id,
            'label'        => $this->label,
            'event'        => $this->event,
            'description'  => $this->description,
            'changes'      => $this->changes,
            'user'         => $this->whenLoaded('user', fn () => $this->user?->name),
            'created_at'   => $this->created_at,
        ];
    }
}
