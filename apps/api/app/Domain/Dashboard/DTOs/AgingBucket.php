<?php

namespace App\Domain\Dashboard\DTOs;

readonly class AgingBucket
{
    public function __construct(
        public string $label,
        public float $amount,
    ) {}
}
