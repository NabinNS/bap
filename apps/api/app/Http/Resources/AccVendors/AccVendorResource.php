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
            'vat_no'           => $this->vat_no,
            'opening_balances' => $this->whenLoaded('openingBalances', fn() => $this->openingBalances->map(fn($ob) => [
                'fiscal_year_id'  => $ob->fiscal_year_id,
                'opening_balance' => $ob->opening_balance,
            ])),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
