<?php

namespace App\Http\Requests\Settings;

use Illuminate\Foundation\Http\FormRequest;

class SyncFiscalYearBalancesRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'to_fiscal_year_id' => ['required', 'integer', 'exists:fiscal_years,id'],
        ];
    }

    public function toFiscalYearId(): int
    {
        return (int) $this->validated('to_fiscal_year_id');
    }
}
