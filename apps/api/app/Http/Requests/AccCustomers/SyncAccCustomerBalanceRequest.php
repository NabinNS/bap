<?php

namespace App\Http\Requests\AccCustomers;

use Illuminate\Foundation\Http\FormRequest;

class SyncAccCustomerBalanceRequest extends FormRequest
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
