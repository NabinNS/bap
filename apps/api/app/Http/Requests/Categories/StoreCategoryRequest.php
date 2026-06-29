<?php

namespace App\Http\Requests\Categories;

use App\Domain\Categories\DTOs\CategoryData;
use Illuminate\Foundation\Http\FormRequest;

class StoreCategoryRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name'        => ['required', 'string', 'max:255'],
            'slug'        => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'image'       => ['nullable', 'string'],
            'is_active'   => ['boolean'],
            'sort_order'  => ['integer'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Category name is required.',
            'name.max'      => 'Category name cannot exceed 255 characters.',
            'slug.max'      => 'Slug cannot exceed 255 characters.',
            'is_active.boolean' => 'The active status must be true or false.',
            'sort_order.integer' => 'Sort order must be a whole number.',
        ];
    }

    public function toDTO(): CategoryData
    {
        $v = $this->validated();

        return new CategoryData(
            name:        $v['name'],
            slug:        $v['slug'] ?? null,
            description: $v['description'] ?? null,
            image:       $v['image'] ?? null,
            isActive:    $v['is_active'] ?? true,
            sortOrder:   $v['sort_order'] ?? 0,
        );
    }
}
