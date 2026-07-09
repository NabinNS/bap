<?php

namespace App\Domain\Images\DTOs;

readonly class ImageGroupData
{
    public function __construct(
        public string $imageableType,
        public string $imageableUlid,
        public string $slug,
        public string $name,
    ) {}
}
