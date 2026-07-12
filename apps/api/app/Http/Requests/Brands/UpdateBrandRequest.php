<?php

namespace App\Http\Requests\Brands;

use App\Domain\Brands\DTOs\BrandData;
use Illuminate\Foundation\Http\FormRequest;

class UpdateBrandRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name'        => ['sometimes', 'string', 'max:255'],
            'slug'        => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'is_active'   => ['boolean'],
            'sort_order'  => ['integer'],
        ];
    }

    public function toDTO(): BrandData
    {
        $v = $this->validated();

        return new BrandData(
            name:        $v['name'] ?? $this->route('brand')->name,
            slug:        $v['slug'] ?? null,
            description: $v['description'] ?? null,
            isActive:    $v['is_active'] ?? $this->route('brand')->is_active,
            sortOrder:   $v['sort_order'] ?? $this->route('brand')->sort_order,
        );
    }
}
