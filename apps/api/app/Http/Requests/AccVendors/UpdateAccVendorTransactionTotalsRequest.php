<?php

namespace App\Http\Requests\AccVendors;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAccVendorTransactionTotalsRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'discount_percent' => ['required', 'integer', 'min:0', 'max:100'],
        ];
    }
}
