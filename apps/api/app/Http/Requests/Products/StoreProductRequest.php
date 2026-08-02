<?php

namespace App\Http\Requests\Products;

use App\Domain\Products\DTOs\ProductData;
use App\Models\Brand;
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

        if ($this->brand_ulid) {
            $this->merge([
                'brand_id' => Brand::where('ulid', $this->brand_ulid)->value('id'),
            ]);
        }
    }

    public function rules(): array
    {
        return [
            'name'               => ['required', 'string', 'max:255'],
            'sku'                => ['nullable', 'string', 'max:255'],
            'slug'               => ['nullable', 'string', 'max:255'],
            'category_id'        => ['nullable', 'integer', 'exists:categories,id'],
            'brand_id'           => ['nullable', 'integer', 'exists:brands,id'],
            'description'        => ['nullable', 'string'],
            'image'              => ['nullable', 'string'],
            'cost_price'         => ['required', 'integer', 'min:0'],
            'sales_price'        => ['required', 'integer', 'min:0'],
            'stock'              => ['required', 'integer', 'min:0'],
            'low_stock_quantity' => ['nullable', 'integer', 'min:0'],
            'is_active'          => ['boolean'],
            'is_featured'        => ['boolean'],
            'sort_order'         => ['integer'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required'      => 'Product name is required.',
            'category_id.exists' => 'The selected category is invalid.',
            'brand_id.exists'    => 'The selected brand is invalid.',
            'stock.required'     => 'Stock quantity is required.',
            'stock.min'          => 'Stock cannot be negative.',
        ];
    }

    public function toDTO(): ProductData
    {
        $v = $this->validated();

        return new ProductData(
            name:             $v['name'],
            brandId:          isset($v['brand_id']) ? (int) $v['brand_id'] : null,
            sku:              $v['sku'] ?? null,
            slug:             $v['slug'] ?? null,
            categoryId:       isset($v['category_id']) ? (int) $v['category_id'] : null,
            description:      $v['description'] ?? null,
            image:            $v['image'] ?? null,
            costPrice:        (int) $v['cost_price'],
            salesPrice:       (int) $v['sales_price'],
            stock:            (int) $v['stock'],
            lowStockQuantity: isset($v['low_stock_quantity']) ? (int) $v['low_stock_quantity'] : null,
            isActive:         $v['is_active'] ?? true,
            isFeatured:       $v['is_featured'] ?? false,
            sortOrder:        $v['sort_order'] ?? 0,
        );
    }
}
