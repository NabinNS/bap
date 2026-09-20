<?php

namespace App\Http\Requests\AccCustomers;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAccCustomerTransactionTotalsRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'discount_percent' => ['required_without:discount_amount', 'nullable', 'integer', 'min:0', 'max:100'],
            'discount_amount'  => ['required_without:discount_percent', 'nullable', 'integer', 'min:0'],
        ];
    }
}
