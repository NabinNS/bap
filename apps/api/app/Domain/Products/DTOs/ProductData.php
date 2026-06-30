<?php

namespace App\Domain\Products\DTOs;

readonly class ProductData
{
    public function __construct(
        public string  $name,
        public ?string $slug,
        public ?int    $categoryId,
        public ?string $description,
        public ?string $image,
        public int     $price,
        public int     $stock,
        public bool    $isActive,
        public int     $sortOrder,
    ) {}
}
