<?php

namespace App\Domain\Categories\DTOs;

readonly class CategoryData
{
    public function __construct(
        public string  $name,
        public ?string $slug,
        public ?string $description,
        public ?string $image,
        public bool    $isActive,
        public int     $sortOrder,
    ) {}
}
