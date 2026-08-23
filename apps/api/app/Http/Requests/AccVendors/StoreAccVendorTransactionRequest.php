<?php

namespace App\Http\Requests\AccVendors;

use App\Enums\TransactionParticular;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreAccVendorTransactionRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'date'       => ['required', 'string', 'max:20'],
            'particular' => ['required', Rule::enum(TransactionParticular::class)],
            'voucher_no' => ['nullable', 'string', 'max:100'],
            'debit'      => ['nullable', 'numeric', 'min:0'],
            'credit'     => ['nullable', 'numeric', 'min:0'],
        ];
    }
}
