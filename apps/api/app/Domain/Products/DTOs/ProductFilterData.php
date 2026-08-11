<?php

namespace App\Domain\Products\DTOs;

use Illuminate\Http\Request;

readonly class ProductFilterData
{
    public function __construct(
        public ?string $search = null,
        public ?bool   $isActive = null,
        public ?string $categoryUlid = null,
        public ?string $brandUlid = null,
        public ?float  $minPrice = null,
        public ?float  $maxPrice = null,
        public ?bool   $hasDiscount = null,
        public string  $sortBy = 'sort_order',
        public string  $sortDir = 'asc',
    ) {}

    public static function fromRequest(Request $request): self
    {
        return new self(
            search:       $request->string('search')->toString() ?: null,
            isActive:     $request->has('is_active') ? $request->boolean('is_active') : null,
            categoryUlid: $request->string('category_ulid')->toString() ?: null,
            brandUlid:    $request->string('brand_ulid')->toString() ?: null,
            minPrice:     $request->has('min_price') ? (float) $request->input('min_price') : null,
            maxPrice:     $request->has('max_price') ? (float) $request->input('max_price') : null,
            hasDiscount:  $request->has('has_discount') ? $request->boolean('has_discount') : null,
            sortBy:       in_array($request->string('sort_by')->toString(), ['name', 'created_at', 'sort_order', 'sales_price'])
                              ? $request->string('sort_by')->toString()
                              : 'sort_order',
            sortDir:      $request->string('sort_dir')->toString() === 'desc' ? 'desc' : 'asc',
        );
    }
}
