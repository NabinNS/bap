<?php

namespace App\Http\Resources\AccVendors;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AccVendorBalanceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'vendor_id'         => $this->vendor->ulid,
            'fiscal_year_id'    => $this->fiscal_year_id,
            'opening_balance'   => $this->opening_balance,
            'remaining_balance' => $this->remaining_balance,
        ];
    }
}
