<?php

namespace App\Http\Requests\AccPurchaseOrders;

use App\Domain\AccPurchaseOrders\DTOs\AccPurchaseOrderData;
use Illuminate\Foundation\Http\FormRequest;

class UpdateAccPurchaseOrderRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'date'       => ['required', 'string', 'max:20'],
            'voucher_no' => ['nullable', 'string', 'max:100'],
        ];
    }

    public function toDTO(): AccPurchaseOrderData
    {
        $v = $this->validated();

        return new AccPurchaseOrderData(
            date:      $v['date'],
            voucherNo: $v['voucher_no'] ?? null,
            items:     [],
        );
    }
}
