<?php

namespace App\Http\Requests\AccQuotations;

use App\Domain\AccQuotations\DTOs\AccQuotationItemData;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreAccQuotationItemRequest extends FormRequest
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

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $amount   = (int) $this->input('quantity', 0) * (int) $this->input('rate', 0);
            $discount = (int) $this->input('discount', 0);

            if ($discount > $amount) {
                $validator->errors()->add('discount', 'Discount cannot exceed the line amount.');
            }
        });
    }

    public function toDTO(): AccQuotationItemData
    {
        $v = $this->validated();

        return new AccQuotationItemData(
            productUlid: $v['product_ulid'],
            quantity:    (int) $v['quantity'],
            rate:        (int) $v['rate'],
            discount:    (int) ($v['discount'] ?? 0),
        );
    }
}
