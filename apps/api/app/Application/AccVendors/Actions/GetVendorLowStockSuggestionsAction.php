<?php

namespace App\Application\AccVendors\Actions;

use App\Domain\AccVendors\Repositories\AccVendorRepositoryInterface;
use App\Models\AccVendor;
use Illuminate\Support\Collection;

class GetVendorLowStockSuggestionsAction
{
    public function __construct(
        private AccVendorRepositoryInterface $repository,
    ) {
    }

    public function execute(int $tenantId, AccVendor $vendor): Collection
    {
        return $this->repository->findLowStockProductsPreviouslyPurchased($tenantId, $vendor);
    }
}
