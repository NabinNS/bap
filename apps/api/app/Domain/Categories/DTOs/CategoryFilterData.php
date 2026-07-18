<?php

namespace App\Domain\Categories\DTOs;

use Illuminate\Http\Request;

readonly class CategoryFilterData
{
    public function __construct(
        public ?string $search = null,
        public ?bool   $isActive = null,
        public string  $sortBy = 'created_at',
        public string  $sortDir = 'desc',
    ) {}

    public static function fromRequest(Request $request): self
    {
        return new self(
            search:   $request->string('search')->toString() ?: null,
            isActive: $request->has('is_active') ? $request->boolean('is_active') : null,
            sortBy:   in_array($request->string('sort_by')->toString(), ['name', 'created_at', 'sort_order'])
                          ? $request->string('sort_by')->toString()
                          : 'created_at',
            sortDir:  $request->string('sort_dir')->toString() === 'asc' ? 'asc' : 'desc',
        );
    }
}
