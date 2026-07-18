<?php

namespace App\Domain\Offers\DTOs;

readonly class OfferData
{
    public function __construct(
        public string  $title,
        public ?string $subTitle,
        public bool    $isActive,
        public int     $sortOrder,
    ) {}
}
