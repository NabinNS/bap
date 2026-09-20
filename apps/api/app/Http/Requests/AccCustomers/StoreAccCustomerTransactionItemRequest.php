<?php

namespace App\Http\Requests\AccCustomers;

use App\Domain\AccCustomers\DTOs\AccCustomerTransactionItemData;
use Illuminate\Foundation\Http\FormRequest;

class StoreAccCustomerTransactionItemRequest extends FormRequest
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

    public function toDTO(): AccCustomerTransactionItemData
    {
        $v = $this->validated();

        return new AccCustomerTransactionItemData(
            productUlid: $v['product_ulid'],
            quantity:    (int) $v['quantity'],
            rate:        (int) $v['rate'],
            discount:    (int) ($v['discount'] ?? 0),
        );
    }
}
