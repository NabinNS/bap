<?php

namespace App\Http\Requests\AccCustomers;

use App\Domain\AccCustomers\DTOs\AccCustomerTransactionData;
use App\Domain\AccCustomers\DTOs\AccCustomerTransactionItemData;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreAccCustomerTransactionRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'date'       => ['required', 'string', 'max:20'],
            // Customers never have "purchase" or "purchase_non_vat" — restricted to the
            // particulars that make sense on a customer ledger.
            'particular' => ['required', Rule::in(['sales', 'cash', 'cheque', 'debit_note', 'credit_note'])],
            'voucher_no' => ['nullable', 'string', 'max:100'],
            'cheque_no'  => ['nullable', 'string', 'max:100'],
            'debit'      => ['nullable', 'numeric', 'min:0'],
            'credit'     => ['nullable', 'numeric', 'min:0'],
            'discount_percent' => ['nullable', 'integer', 'min:0', 'max:100'],
            'fiscal_year_id'   => ['nullable', 'integer', 'exists:fiscal_years,id'],
            'payment_type'     => ['nullable', Rule::in(['cash', 'credit'])],

            'items'                    => ['nullable', 'array'],
            'items.*.product_ulid'     => ['required_with:items', 'string', 'exists:products,ulid'],
            'items.*.quantity'         => ['required_with:items', 'integer', 'min:1'],
            'items.*.rate'             => ['required_with:items', 'integer', 'min:0'],
            'items.*.discount'         => ['nullable', 'integer', 'min:0'],
        ];
    }

    public function toDTO(): AccCustomerTransactionData
    {
        $v = $this->validated();

        return new AccCustomerTransactionData(
            date:            $v['date'],
            particular:      $v['particular'],
            voucherNo:       $v['voucher_no'] ?? null,
            chequeNo:        $v['cheque_no'] ?? null,
            debit:           isset($v['debit']) ? (float) $v['debit'] : null,
            credit:          isset($v['credit']) ? (float) $v['credit'] : null,
            discountPercent: $v['discount_percent'] ?? null,
            items:           array_map(
                fn(array $item) => new AccCustomerTransactionItemData(
                    productUlid: $item['product_ulid'],
                    quantity:    (int) $item['quantity'],
                    rate:        (int) $item['rate'],
                    discount:    (int) ($item['discount'] ?? 0),
                ),
                $v['items'] ?? [],
            ),
            fiscalYearId: $v['fiscal_year_id'] ?? null,
            paymentType:  $v['payment_type'] ?? null,
        );
    }
}
