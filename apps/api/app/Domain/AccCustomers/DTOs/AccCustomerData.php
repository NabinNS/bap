<?php

namespace App\Domain\AccCustomers\DTOs;

readonly class AccCustomerData
{
    public function __construct(
        public string  $name,
        public ?string $address,
        public ?string $phone,
        public ?string $telephone,
        public ?string $vatNo,
    ) {}
}
