<?php

namespace App\Http\Resources\AccCustomers;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AccCustomerBalanceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'customer_id'       => $this->customer->ulid,
            'fiscal_year_id'    => $this->fiscal_year_id,
            'opening_balance'   => $this->opening_balance,
            'remaining_balance' => $this->remaining_balance,
        ];
    }
}
