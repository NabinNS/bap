<?php

namespace App\Domain\Sliders\DTOs;

readonly class SliderData
{
    public function __construct(
        public string  $name,
        public bool    $isActive,
        public int     $sortOrder,
        public ?string $deadlineDate,
    ) {}
}
