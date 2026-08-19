<?php

namespace App\Http\Resources\AccVendors;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AccVendorResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'ulid'      => $this->ulid,
            'name'      => $this->name,
            'address'   => $this->address,
            'phone'     => $this->phone,
            'telephone' => $this->telephone,
            'vat_no'    => $this->vat_no,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
