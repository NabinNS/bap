<?php

namespace App\Http\Requests\AccCustomers;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAccCustomerTransactionTotalsRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'discount_percent' => ['required_without_all:discount_amount,vat_exempt', 'nullable', 'integer', 'min:0', 'max:100'],
            'discount_amount'  => ['required_without_all:discount_percent,vat_exempt', 'nullable', 'integer', 'min:0'],
            'vat_exempt'       => ['nullable', 'boolean'],
        ];
    }
}
