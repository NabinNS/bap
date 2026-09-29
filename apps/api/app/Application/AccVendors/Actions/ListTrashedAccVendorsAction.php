<?php

namespace App\Application\AccVendors\Actions;

use App\Domain\AccVendors\Repositories\AccVendorRepositoryInterface;
use Illuminate\Support\Collection;

class ListTrashedAccVendorsAction
{
    public function __construct(
        private AccVendorRepositoryInterface $vendors,
    ) {}

    public function execute(int $tenantId): Collection
    {
        return $this->vendors->trashed($tenantId);
    }
}
