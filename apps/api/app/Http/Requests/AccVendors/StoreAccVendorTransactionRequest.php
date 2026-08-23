<?php

namespace App\Http\Requests\AccVendors;

use Illuminate\Foundation\Http\FormRequest;

class StoreAccVendorTransactionRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'date'       => ['required', 'date'],
            'particular' => ['required', 'string', 'max:500'],
            'voucher_no' => ['nullable', 'string', 'max:100'],
            'debit'      => ['nullable', 'numeric', 'min:0'],
            'credit'     => ['nullable', 'numeric', 'min:0'],
        ];
    }
}
