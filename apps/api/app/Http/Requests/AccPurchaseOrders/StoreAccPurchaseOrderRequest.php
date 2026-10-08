<?php

namespace App\Http\Requests\AccPurchaseOrders;

use App\Domain\AccPurchaseOrders\DTOs\AccPurchaseOrderData;
use App\Domain\AccPurchaseOrders\DTOs\AccPurchaseOrderItemData;
use Illuminate\Foundation\Http\FormRequest;

class StoreAccPurchaseOrderRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'date'           => ['required', 'string', 'max:20'],
            'voucher_no'     => ['nullable', 'string', 'max:100'],
            'fiscal_year_id' => ['nullable', 'integer', 'exists:fiscal_years,id'],

            'items'                => ['nullable', 'array'],
            'items.*.product_ulid' => ['required_with:items', 'string', 'exists:products,ulid'],
            'items.*.quantity'     => ['nullable', 'integer', 'min:1'],
            'items.*.rate'         => ['nullable', 'numeric', 'min:0'],
        ];
    }

    public function toDTO(): AccPurchaseOrderData
    {
        $v = $this->validated();

        return new AccPurchaseOrderData(
            date:      $v['date'],
            voucherNo: $v['voucher_no'] ?? null,
            items:     array_map(
                fn(array $item) => new AccPurchaseOrderItemData(
                    productUlid: $item['product_ulid'],
                    quantity:    isset($item['quantity']) ? (int) $item['quantity'] : null,
                    rate:        isset($item['rate']) ? (float) $item['rate'] : null,
                ),
                $v['items'] ?? [],
            ),
            fiscalYearId: $v['fiscal_year_id'] ?? null,
        );
    }
}
