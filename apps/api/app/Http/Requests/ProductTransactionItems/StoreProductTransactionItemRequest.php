<?php

namespace App\Http\Requests\ProductTransactionItems;

use App\Domain\ProductTransactionItems\DTOs\ProductTransactionItemData;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreProductTransactionItemRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'fiscal_year_id' => ['nullable', 'integer', 'exists:fiscal_years,id'],
            'date' => ['required', 'string', 'max:20'],
            'type' => ['required', Rule::in(['purchase', 'sale'])],
            'purchase_quantity' => ['required_if:type,purchase', 'nullable', 'integer', 'min:1'],
            'purchase_price'    => ['required_if:type,purchase', 'nullable', 'integer', 'min:0'],
            'sales_quantity'    => ['required_if:type,sale', 'nullable', 'integer', 'min:1'],
            'sales_price'       => ['required_if:type,sale', 'nullable', 'integer', 'min:0'],
        ];
    }

    public function toDTO(): ProductTransactionItemData
    {
        $v = $this->validated();

        return new ProductTransactionItemData(
            fiscalYearId:     $v['fiscal_year_id'] ?? null,
            date:             $v['date'],
            type:             $v['type'],
            purchaseQuantity: isset($v['purchase_quantity']) ? (int) $v['purchase_quantity'] : null,
            purchasePrice:    isset($v['purchase_price']) ? (int) $v['purchase_price'] : null,
            salesQuantity:    isset($v['sales_quantity']) ? (int) $v['sales_quantity'] : null,
            salesPrice:       isset($v['sales_price']) ? (int) $v['sales_price'] : null,
        );
    }
}
