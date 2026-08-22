<?php

namespace App\Http\Requests\Settings;

use App\Domain\Settings\DTOs\TenantSettingData;
use Illuminate\Foundation\Http\FormRequest;

class UpdateTenantSettingRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'fiscal_year_id' => ['nullable', 'integer'],
            'meta'           => ['nullable', 'array'],
        ];
    }

    public function toDTO(): TenantSettingData
    {
        $v = $this->validated();

        return new TenantSettingData(
            fiscalYearId: $v['fiscal_year_id'] ?? null,
            meta:         $v['meta'] ?? null,
        );
    }
}
