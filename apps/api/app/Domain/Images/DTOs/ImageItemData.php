<?php

namespace App\Domain\Images\DTOs;

readonly class ImageItemData
{
    public function __construct(
        public string $url,
        public string $path,
        public int    $sortOrder,
    ) {}
}
