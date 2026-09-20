<?php

namespace App\Http\Requests\ProductStockBalances;

use App\Domain\ProductStockBalances\DTOs\ProductStockBalanceData;
use Illuminate\Foundation\Http\FormRequest;

class UpsertProductStockBalanceRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'opening_quantity' => ['required', 'integer', 'min:0'],
            'fiscal_year_id'   => ['nullable', 'integer', 'exists:fiscal_years,id'],
        ];
    }

    public function toDTO(): ProductStockBalanceData
    {
        $v = $this->validated();

        return new ProductStockBalanceData(
            openingQuantity: (int) $v['opening_quantity'],
            fiscalYearId:    $v['fiscal_year_id'] ?? null,
        );
    }
}
