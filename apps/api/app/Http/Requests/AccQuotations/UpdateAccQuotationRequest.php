<?php

namespace App\Http\Requests\AccQuotations;

use App\Domain\AccQuotations\DTOs\AccQuotationData;
use Illuminate\Foundation\Http\FormRequest;

class UpdateAccQuotationRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'date'       => ['required', 'string', 'max:20'],
            'voucher_no' => ['nullable', 'string', 'max:100'],
        ];
    }

    public function toDTO(): AccQuotationData
    {
        $v = $this->validated();

        return new AccQuotationData(
            date:            $v['date'],
            voucherNo:       $v['voucher_no'] ?? null,
            discountPercent: null,
            items:           [],
        );
    }
}
