<?php

namespace App\Http\Requests\Products;

use App\Domain\Products\DTOs\ProductData;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Foundation\Http\FormRequest;

class UpdateProductRequest extends FormRequest
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
            'name'        => ['sometimes', 'string', 'max:255'],
            'slug'        => ['nullable', 'string', 'max:255'],
            'category_id' => ['nullable', 'integer', 'exists:categories,id'],
            'description' => ['nullable', 'string'],
            'image'       => ['nullable', 'string'],
            'price'       => ['sometimes', 'integer', 'min:0'],
            'stock'       => ['sometimes', 'integer', 'min:0'],
            'is_active'   => ['boolean'],
            'sort_order'  => ['integer'],
        ];
    }

    public function messages(): array
    {
        return [
            'category_id.exists' => 'The selected category is invalid.',
        ];
    }

    public function toDTO(): ProductData
    {
        $v       = $this->validated();
        $product = $this->route('product');

        return new ProductData(
            name:        $v['name']        ?? $product->name,
            slug:        $v['slug']        ?? null,
            categoryId:  $this->resolveCategoryId($v, $product),
            description: $v['description'] ?? $product->description,
            image:       $v['image']       ?? $product->image,
            price:       (int) ($v['price'] ?? $product->price),
            stock:       (int) ($v['stock'] ?? $product->stock),
            isActive:    $v['is_active']   ?? $product->is_active,
            sortOrder:   $v['sort_order']  ?? $product->sort_order,
        );
    }

    private function resolveCategoryId(array $v, Product $product): ?int
    {
        // Not sent at all — keep existing
        if (! array_key_exists('category_id', $v)) {
            return $product->category_id;
        }

        // Sent as null — clear the category
        return isset($v['category_id']) ? (int) $v['category_id'] : null;
    }
}
