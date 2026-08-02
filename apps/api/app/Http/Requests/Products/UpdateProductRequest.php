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
            'price'              => ['sometimes', 'integer', 'min:0'],
            'cost_price'         => ['sometimes', 'required', 'integer', 'min:0'],
            'sales_price'        => ['sometimes', 'required', 'integer', 'min:0'],
            'discount_percent'   => ['nullable', 'integer', 'min:0', 'max:100'],
            'stock'              => ['sometimes', 'integer', 'min:0'],
            'low_stock_quantity' => ['nullable', 'integer', 'min:0'],
            'is_active'          => ['boolean'],
            'sort_order'         => ['integer'],
        ];
    }

    public function messages(): array
    {
        return [
            'category_id.exists' => 'The selected category is invalid.',
        ];
    }

    public function toDTO(Product $product): ProductData
    {
        $v = $this->validated();

        return new ProductData(
            name:             $v['name']        ?? $product->name,
            slug:             $v['slug']        ?? null,
            categoryId:       $this->resolveCategoryId($v, $product),
            description:      $v['description'] ?? $product->description,
            image:            $v['image']       ?? $product->image,
            price:            (int) ($v['price'] ?? $product->price),
            costPrice:        (int) ($v['cost_price'] ?? $product->cost_price),
            salesPrice:       (int) ($v['sales_price'] ?? $product->sales_price),
            discountPercent:  array_key_exists('discount_percent', $v) ? (isset($v['discount_percent']) ? (int) $v['discount_percent'] : null) : $product->discount_percent,
            stock:            (int) ($v['stock'] ?? $product->stock),
            lowStockQuantity: array_key_exists('low_stock_quantity', $v) ? (isset($v['low_stock_quantity']) ? (int) $v['low_stock_quantity'] : null) : $product->low_stock_quantity,
            isActive:         $v['is_active']   ?? $product->is_active,
            sortOrder:        $v['sort_order']  ?? $product->sort_order,
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
