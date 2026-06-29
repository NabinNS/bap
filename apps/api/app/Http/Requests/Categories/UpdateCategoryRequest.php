<?php

namespace App\Http\Requests\Categories;

use App\Domain\Categories\DTOs\CategoryData;
use Illuminate\Foundation\Http\FormRequest;

class UpdateCategoryRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name'        => ['sometimes', 'string', 'max:255'],
            'slug'        => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'image'       => ['nullable', 'string'],
            'is_active'   => ['boolean'],
            'sort_order'  => ['integer'],
        ];
    }

    public function toDTO(): CategoryData
    {
        $v = $this->validated();

        return new CategoryData(
            name:        $v['name'] ?? $this->route('category')->name,
            slug:        $v['slug'] ?? null,
            description: $v['description'] ?? null,
            image:       $v['image'] ?? null,
            isActive:    $v['is_active'] ?? $this->route('category')->is_active,
            sortOrder:   $v['sort_order'] ?? $this->route('category')->sort_order,
        );
    }
}
