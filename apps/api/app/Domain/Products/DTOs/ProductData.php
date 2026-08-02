<?php

namespace App\Domain\Products\DTOs;

readonly class ProductData
{
    public function __construct(
        public string  $name,
        public ?int    $brandId,
        public ?string $sku,
        public ?string $slug,
        public ?int    $categoryId,
        public ?string $description,
        public ?string $image,
        public int     $costPrice,
        public int     $salesPrice,
        public ?int    $discountPercent,
        public int     $stock,
        public ?int    $lowStockQuantity,
        public bool    $isActive,
        public bool    $isFeatured,
        public int     $sortOrder,
    ) {}
}
