<?php

namespace App\Http\Resources\Settings;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TenantSettingResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'fiscal_year_id' => $this->fiscal_year_id,
            'fiscal_year'    => $this->whenLoaded('fiscalYear', fn() => $this->fiscalYear ? [
                'ulid' => $this->fiscalYear->ulid,
                'name' => $this->fiscalYear->name,
            ] : null),
            'meta'           => $this->meta,
            'updated_at'     => $this->updated_at,
        ];
    }
}
