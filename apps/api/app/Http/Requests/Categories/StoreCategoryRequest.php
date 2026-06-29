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
