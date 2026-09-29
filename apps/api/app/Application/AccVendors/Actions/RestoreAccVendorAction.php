<?php

namespace App\Application\AccVendors\Actions;

use App\Domain\AccVendors\Repositories\AccVendorRepositoryInterface;
use App\Models\AccVendor;

class RestoreAccVendorAction
{
    public function __construct(
        private AccVendorRepositoryInterface $vendors,
    ) {}

    public function execute(int $tenantId, string $vendorUlid): AccVendor
    {
        return $this->vendors->restore($tenantId, $vendorUlid);
    }
}
