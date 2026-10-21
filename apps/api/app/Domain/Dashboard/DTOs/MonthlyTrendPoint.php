<?php

namespace App\Domain\Dashboard\DTOs;

readonly class MonthlyTrendPoint
{
    public function __construct(
        public string $month,
        public float $revenue,
        public float $cost,
    ) {}
}
