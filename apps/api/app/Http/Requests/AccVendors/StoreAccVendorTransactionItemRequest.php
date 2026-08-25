<?php

namespace App\Http\Requests\AccVendors;

use Illuminate\Foundation\Http\FormRequest;

class StoreAccVendorTransactionItemRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'product_ulid' => ['required', 'string', 'exists:products,ulid'],
            'quantity'     => ['required', 'integer', 'min:1'],
            'rate'         => ['required', 'integer', 'min:0'],
            'discount'     => ['nullable', 'integer', 'min:0'],
        ];
    }
}
