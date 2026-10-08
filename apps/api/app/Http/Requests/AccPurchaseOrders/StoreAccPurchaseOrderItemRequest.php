<?php

namespace App\Http\Requests\AccPurchaseOrders;

use App\Domain\AccPurchaseOrders\DTOs\AccPurchaseOrderItemData;
use Illuminate\Foundation\Http\FormRequest;

class StoreAccPurchaseOrderItemRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'product_ulid' => ['required', 'string', 'exists:products,ulid'],
            'quantity'     => ['nullable', 'integer', 'min:1'],
            'rate'         => ['nullable', 'numeric', 'min:0'],
        ];
    }

    public function toDTO(): AccPurchaseOrderItemData
    {
        $v = $this->validated();

        return new AccPurchaseOrderItemData(
            productUlid: $v['product_ulid'],
            quantity:    isset($v['quantity']) ? (int) $v['quantity'] : null,
            rate:        isset($v['rate']) ? (float) $v['rate'] : null,
        );
    }
}
