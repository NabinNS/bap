<?php

namespace App\Application\AccVendors\Actions;

use App\Domain\AccVendors\DTOs\AccVendorData;
use App\Domain\AccVendors\Repositories\AccVendorRepositoryInterface;
use App\Models\AccVendor;

class CreateAccVendorAction
{
    public function __construct(
        private AccVendorRepositoryInterface $vendors,
    ) {}

    public function execute(int $tenantId, AccVendorData $data): AccVendor
    {
        return $this->vendors->create($tenantId, $data);
    }
}
