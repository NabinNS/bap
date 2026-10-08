<?php

namespace App\Http\Requests\AccVendors;

use Illuminate\Foundation\Http\FormRequest;

class SyncAccVendorBalanceRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'fiscal_year_id' => ['required', 'integer', 'exists:fiscal_years,id'],
        ];
    }

    public function fiscalYearId(): int
    {
        return (int) $this->validated('fiscal_year_id');
    }
}
