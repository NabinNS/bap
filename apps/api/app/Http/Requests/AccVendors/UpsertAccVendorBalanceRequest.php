<?php

namespace App\Http\Requests\AccVendors;

use App\Domain\AccVendors\DTOs\AccVendorBalanceData;
use Illuminate\Foundation\Http\FormRequest;

class UpsertAccVendorBalanceRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'opening_balance' => ['required', 'numeric', 'min:0'],
            'fiscal_year_id'  => ['nullable', 'integer', 'exists:fiscal_years,id'],
        ];
    }

    public function toDTO(): AccVendorBalanceData
    {
        $v = $this->validated();

        return new AccVendorBalanceData(
            openingBalance: (float) $v['opening_balance'],
            fiscalYearId:   $v['fiscal_year_id'] ?? null,
        );
    }
}
