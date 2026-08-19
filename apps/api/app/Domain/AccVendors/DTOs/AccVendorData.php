<?php

namespace App\Domain\AccVendors\DTOs;

readonly class AccVendorData
{
    public function __construct(
        public string  $name,
        public ?string $address,
        public ?string $phone,
        public ?string $telephone,
        public ?string $vatNo,
    ) {}
}
