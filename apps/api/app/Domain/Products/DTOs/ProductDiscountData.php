<?php

namespace App\Domain\Products\DTOs;

readonly class ProductDiscountData
{
    public function __construct(
        public int     $percentage,
        public ?string $startsAt,
        public ?string $endsAt,
        public bool    $isActive,
    ) {}
}
