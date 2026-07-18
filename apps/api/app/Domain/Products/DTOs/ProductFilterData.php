<?php

namespace App\Domain\Products\DTOs;

use Illuminate\Http\Request;

readonly class ProductFilterData
{
    public function __construct(
        public ?string $search = null,
        public ?bool   $isActive = null,
        public ?string $categoryUlid = null,
        public string  $sortBy = 'sort_order',
        public string  $sortDir = 'asc',
    ) {}

    public static function fromRequest(Request $request): self
    {
        return new self(
            search:       $request->string('search')->toString() ?: null,
            isActive:     $request->has('is_active') ? $request->boolean('is_active') : null,
            categoryUlid: $request->string('category')->toString() ?: null,
            sortBy:       in_array($request->string('sort_by')->toString(), ['name', 'created_at', 'sort_order', 'price'])
                              ? $request->string('sort_by')->toString()
                              : 'sort_order',
            sortDir:      $request->string('sort_dir')->toString() === 'desc' ? 'desc' : 'asc',
        );
    }
}
