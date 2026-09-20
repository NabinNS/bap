<?php

namespace App\Domain\AccCustomers\DTOs;

use Illuminate\Http\Request;

readonly class AccCustomerFilterData
{
    public function __construct(
        public ?string $search = null,
        public string  $sortBy = 'created_at',
        public string  $sortDir = 'desc',
    ) {}

    public static function fromRequest(Request $request): self
    {
        return new self(
            search:   $request->string('search')->toString() ?: null,
            sortBy:   in_array($request->string('sort_by')->toString(), ['name', 'created_at'])
                          ? $request->string('sort_by')->toString()
                          : 'created_at',
            sortDir:  $request->string('sort_dir')->toString() === 'asc' ? 'asc' : 'desc',
        );
    }
}
