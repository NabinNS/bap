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
            'discount_percent' => ['nullable', 'integer', 'min:0', 'max:100'],

            'items'                    => ['nullable', 'array'],
            'items.*.product_ulid'     => ['required_with:items', 'string', 'exists:products,ulid'],
            'items.*.quantity'         => ['required_with:items', 'integer', 'min:1'],
            'items.*.rate'             => ['required_with:items', 'integer', 'min:0'],
            'items.*.discount'         => ['nullable', 'integer', 'min:0'],
        ];
    }
}
