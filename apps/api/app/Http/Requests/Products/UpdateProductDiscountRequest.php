<?php

namespace App\Http\Requests\Products;

use App\Domain\Products\DTOs\ProductDiscountData;
use App\Models\ProductDiscount;
use Illuminate\Foundation\Http\FormRequest;

class UpdateProductDiscountRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'percentage' => ['required', 'integer', 'min:1', 'max:100'],
            'starts_at'  => ['nullable', 'date'],
            'ends_at'    => ['nullable', 'date', 'after_or_equal:starts_at'],
            'is_active'  => ['boolean'],
        ];
    }

    public function toDTO(ProductDiscount $discount): ProductDiscountData
    {
        $v = $this->validated();

        return new ProductDiscountData(
            percentage: (int) $v['percentage'],
            startsAt:   $v['starts_at'] ?? null,
            endsAt:     $v['ends_at'] ?? null,
            isActive:   $v['is_active'] ?? $discount->is_active,
        );
    }
}
