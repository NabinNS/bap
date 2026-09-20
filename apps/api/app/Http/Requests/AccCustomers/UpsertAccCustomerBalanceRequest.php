<?php

namespace App\Http\Requests\AccCustomers;

use App\Domain\AccCustomers\DTOs\AccCustomerBalanceData;
use Illuminate\Foundation\Http\FormRequest;

class UpsertAccCustomerBalanceRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'opening_balance' => ['required', 'numeric', 'min:0'],
            'fiscal_year_id'  => ['nullable', 'integer', 'exists:fiscal_years,id'],
        ];
    }

    public function toDTO(): AccCustomerBalanceData
    {
        $v = $this->validated();

        return new AccCustomerBalanceData(
            openingBalance: (float) $v['opening_balance'],
            fiscalYearId:   $v['fiscal_year_id'] ?? null,
        );
    }
}
