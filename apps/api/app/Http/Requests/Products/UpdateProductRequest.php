<?php

namespace App\Http\Requests\Products;

use App\Domain\Products\DTOs\ProductData;
use App\Models\Brand;
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

        if ($this->brand_ulid) {
            $this->merge([
                'brand_id' => Brand::where('ulid', $this->brand_ulid)->value('id'),
            ]);
        }
    }

    public function rules(): array
    {
        return [
            'name'               => ['sometimes', 'string', 'max:255'],
            'sku'                => ['nullable', 'string', 'max:255'],
            'slug'               => ['nullable', 'string', 'max:255'],
            'category_id'        => ['nullable', 'integer', 'exists:categories,id'],
            'brand_id'           => ['nullable', 'integer', 'exists:brands,id'],
            'description'        => ['nullable', 'string'],
            'image'              => ['nullable', 'string'],
            'cost_price'         => ['sometimes', 'required', 'integer', 'min:0'],
            'sales_price'        => ['sometimes', 'required', 'integer', 'min:0'],
            'stock'              => ['sometimes', 'integer', 'min:0'],
            'low_stock_quantity' => ['nullable', 'integer', 'min:0'],
            'is_active'          => ['boolean'],
            'is_featured'        => ['boolean'],
            'sort_order'                    => ['integer'],
            'additional_information'         => ['nullable', 'array'],
            'additional_information.*.title'   => ['required', 'string'],
            'additional_information.*.content' => ['nullable', 'string'],
        ];
    }

    public function messages(): array
    {
        return [
            'category_id.exists' => 'The selected category is invalid.',
            'brand_id.exists'    => 'The selected brand is invalid.',
        ];
    }

    public function toDTO(Product $product): ProductData
    {
        $v = $this->validated();

        return new ProductData(
            name:             $v['name']           ?? $product->name,
            brandId:          $this->resolveBrandId($v, $product),
            sku:              array_key_exists('sku', $v) ? $v['sku'] : $product->sku,
            slug:             $v['slug']            ?? null,
            categoryId:       $this->resolveCategoryId($v, $product),
            description:      $v['description']    ?? $product->description,
            image:            $v['image']           ?? $product->image,
            costPrice:        (int) ($v['cost_price']  ?? $product->cost_price),
            salesPrice:       (int) ($v['sales_price'] ?? $product->sales_price),
            stock:            (int) ($v['stock']    ?? $product->stock),
            lowStockQuantity: array_key_exists('low_stock_quantity', $v) ? (isset($v['low_stock_quantity']) ? (int) $v['low_stock_quantity'] : null) : $product->low_stock_quantity,
            isActive:         $v['is_active']       ?? $product->is_active,
            isFeatured:       $v['is_featured']     ?? $product->is_featured,
            sortOrder:             $v['sort_order']      ?? $product->sort_order,
            additionalInformation: array_key_exists('additional_information', $v) ? $v['additional_information'] : $product->additional_information,
        );
    }

    private function resolveCategoryId(array $v, Product $product): ?int
    {
        if (! array_key_exists('category_id', $v)) return $product->category_id;
        return isset($v['category_id']) ? (int) $v['category_id'] : null;
    }

    private function resolveBrandId(array $v, Product $product): ?int
    {
        if (! array_key_exists('brand_id', $v)) return $product->brand_id;
        return isset($v['brand_id']) ? (int) $v['brand_id'] : null;
    }
}
