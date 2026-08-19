<?php

namespace App\Application\AccVendors\Actions;

use App\Domain\AccVendors\DTOs\AccVendorData;
use App\Domain\AccVendors\Repositories\AccVendorRepositoryInterface;
use App\Models\AccVendor;

class UpdateAccVendorAction
{
    public function __construct(
        private AccVendorRepositoryInterface $vendors,
    ) {}

    public function execute(AccVendor $vendor, AccVendorData $data): AccVendor
    {
        return $this->vendors->update($vendor, $data);
    }
}
