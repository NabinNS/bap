<?php

namespace App\Http\Requests\Products;

use App\Domain\Products\DTOs\ProductData;
use App\Models\Category;
use Illuminate\Foundation\Http\FormRequest;

class StoreProductRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        if ($this->category_ulid) {
            $this->merge([
                'category_id' => Category::where('ulid', $this->category_ulid)->value('id'),
            ]);
        }
    }

    public function rules(): array
    {
        return [
            'name'        => ['required', 'string', 'max:255'],
            'slug'        => ['nullable', 'string', 'max:255'],
            'category_id' => ['nullable', 'integer', 'exists:categories,id'],
            'description' => ['nullable', 'string'],
            'image'       => ['nullable', 'string'],
            'price'       => ['required', 'integer', 'min:0'],
            'stock'       => ['required', 'integer', 'min:0'],
            'is_active'   => ['boolean'],
            'sort_order'  => ['integer'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required'    => 'Product name is required.',
            'category_id.exists' => 'The selected category is invalid.',
            'price.required'   => 'Price is required.',
            'price.min'        => 'Price cannot be negative.',
            'stock.required'   => 'Stock quantity is required.',
            'stock.min'        => 'Stock cannot be negative.',
        ];
    }

    public function toDTO(): ProductData
    {
        $v = $this->validated();

        return new ProductData(
            name:        $v['name'],
            slug:        $v['slug'] ?? null,
            categoryId:  isset($v['category_id']) ? (int) $v['category_id'] : null,
            description: $v['description'] ?? null,
            image:       $v['image'] ?? null,
            price:       (int) $v['price'],
            stock:       (int) $v['stock'],
            isActive:    $v['is_active'] ?? true,
            sortOrder:   $v['sort_order'] ?? 0,
        );
    }
}
