<?php

namespace App\Domain\Settings\DTOs;

readonly class TenantSettingData
{
    public function __construct(
        public ?int   $fiscalYearId,
        public ?array $meta,
    ) {}
}
