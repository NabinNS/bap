<?php

namespace App\Domain\Brands\DTOs;

readonly class BrandData
{
    public function __construct(
        public string  $name,
        public ?string $slug,
        public ?string $description,
        public bool    $isActive,
        public int     $sortOrder,
    ) {}
}
