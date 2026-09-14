<?php

namespace App\Http\Requests\AccVendors;

use App\Domain\AccVendors\DTOs\AccVendorTransactionData;
use App\Domain\AccVendors\DTOs\AccVendorTransactionItemData;
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
            'cheque_no'  => ['nullable', 'string', 'max:100'],
            'debit'      => ['nullable', 'numeric', 'min:0'],
            'credit'     => ['nullable', 'numeric', 'min:0'],
            'discount_percent' => ['nullable', 'integer', 'min:0', 'max:100'],
            'fiscal_year_id'   => ['nullable', 'integer', 'exists:fiscal_years,id'],

            'items'                    => ['nullable', 'array'],
            'items.*.product_ulid'     => ['required_with:items', 'string', 'exists:products,ulid'],
            'items.*.quantity'         => ['required_with:items', 'integer', 'min:1'],
            'items.*.rate'             => ['required_with:items', 'integer', 'min:0'],
            'items.*.discount'         => ['nullable', 'integer', 'min:0'],
        ];
    }

    public function toDTO(): AccVendorTransactionData
    {
        $v = $this->validated();

        return new AccVendorTransactionData(
            date:            $v['date'],
            particular:      $v['particular'],
            voucherNo:       $v['voucher_no'] ?? null,
            chequeNo:        $v['cheque_no'] ?? null,
            debit:           isset($v['debit']) ? (float) $v['debit'] : null,
            credit:          isset($v['credit']) ? (float) $v['credit'] : null,
            discountPercent: $v['discount_percent'] ?? null,
            items:           array_map(
                fn(array $item) => new AccVendorTransactionItemData(
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
