<?php

namespace App\Http\Requests\Brands;

use App\Domain\Brands\DTOs\BrandData;
use Illuminate\Foundation\Http\FormRequest;

class StoreBrandRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name'        => ['required', 'string', 'max:255'],
            'slug'        => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'is_active'   => ['boolean'],
            'sort_order'  => ['integer'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Brand name is required.',
            'name.max'      => 'Brand name cannot exceed 255 characters.',
            'slug.max'      => 'Slug cannot exceed 255 characters.',
            'is_active.boolean' => 'The active status must be true or false.',
            'sort_order.integer' => 'Sort order must be a whole number.',
        ];
    }

    public function toDTO(): BrandData
    {
        $v = $this->validated();

        return new BrandData(
            name:        $v['name'],
            slug:        $v['slug'] ?? null,
            description: $v['description'] ?? null,
            isActive:    $v['is_active'] ?? true,
            sortOrder:   $v['sort_order'] ?? 0,
        );
    }
}
