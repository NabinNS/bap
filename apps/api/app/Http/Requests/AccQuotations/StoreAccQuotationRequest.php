<?php

namespace App\Http\Requests\AccQuotations;

use App\Domain\AccQuotations\DTOs\AccQuotationData;
use App\Domain\AccQuotations\DTOs\AccQuotationItemData;
use Illuminate\Foundation\Http\FormRequest;

class StoreAccQuotationRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'date'             => ['required', 'string', 'max:20'],
            'voucher_no'       => ['nullable', 'string', 'max:100'],
            'discount_percent' => ['nullable', 'integer', 'min:0', 'max:100'],
            'fiscal_year_id'   => ['nullable', 'integer', 'exists:fiscal_years,id'],

            'items'                => ['nullable', 'array'],
            'items.*.product_ulid' => ['required_with:items', 'string', 'exists:products,ulid'],
            'items.*.quantity'     => ['required_with:items', 'integer', 'min:1'],
            'items.*.rate'         => ['required_with:items', 'integer', 'min:0'],
            'items.*.discount'     => ['nullable', 'integer', 'min:0'],
        ];
    }

    public function toDTO(): AccQuotationData
    {
        $v = $this->validated();

        return new AccQuotationData(
            date:            $v['date'],
            voucherNo:       $v['voucher_no'] ?? null,
            discountPercent: $v['discount_percent'] ?? null,
            items:           array_map(
                fn(array $item) => new AccQuotationItemData(
                    productUlid: $item['product_ulid'],
                    quantity:    (int) $item['quantity'],
                    rate:        (int) $item['rate'],
                    discount:    (int) ($item['discount'] ?? 0),
                ),
                $v['items'] ?? [],
            ),
            fiscalYearId: $v['fiscal_year_id'] ?? null,
        );
    }
}
