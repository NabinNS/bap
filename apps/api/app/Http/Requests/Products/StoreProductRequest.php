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
            'price'              => ['nullable', 'integer', 'min:0'],
            'cost_price'         => ['required', 'integer', 'min:0'],
            'sales_price'        => ['required', 'integer', 'min:0'],
            'discount_percent'   => ['nullable', 'integer', 'min:0', 'max:100'],
            'stock'              => ['required', 'integer', 'min:0'],
            'low_stock_quantity' => ['nullable', 'integer', 'min:0'],
            'is_active'          => ['boolean'],
            'sort_order'         => ['integer'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required'    => 'Product name is required.',
            'category_id.exists' => 'The selected category is invalid.',
            'stock.required'   => 'Stock quantity is required.',
            'stock.min'        => 'Stock cannot be negative.',
        ];
    }

    public function toDTO(): ProductData
    {
        $v = $this->validated();

        return new ProductData(
            name:             $v['name'],
            slug:             $v['slug'] ?? null,
            categoryId:       isset($v['category_id']) ? (int) $v['category_id'] : null,
            description:      $v['description'] ?? null,
            image:            $v['image'] ?? null,
            price:            isset($v['price']) ? (int) $v['price'] : 0,
            costPrice:        (int) $v['cost_price'],
            salesPrice:       (int) $v['sales_price'],
            discountPercent:  isset($v['discount_percent']) ? (int) $v['discount_percent'] : null,
            stock:            (int) $v['stock'],
            lowStockQuantity: isset($v['low_stock_quantity']) ? (int) $v['low_stock_quantity'] : null,
            isActive:         $v['is_active'] ?? true,
            sortOrder:        $v['sort_order'] ?? 0,
        );
    }
}
