<?php

namespace App\Http\Requests\AccVendors;

use App\Domain\AccVendors\DTOs\AccVendorTransactionData;
use App\Enums\TransactionParticular;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAccVendorTransactionRequest extends FormRequest
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
            discountPercent: null,
            items:           [],
        );
    }
}
