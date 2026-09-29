<?php

namespace App\Http\Requests\AccCustomers;

use App\Domain\AccCustomers\DTOs\AccCustomerTransactionData;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAccCustomerTransactionRequest extends FormRequest
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
            'payment_type' => ['nullable', Rule::in(['cash', 'credit'])],
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
            discountPercent: null,
            items:           [],
            paymentType:     $v['payment_type'] ?? null,
        );
    }
}
