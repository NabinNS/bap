<?php

namespace App\Application\AccVendors\Actions;

use App\Domain\AccVendors\Repositories\AccVendorRepositoryInterface;
use App\Models\AccVendor;
use Illuminate\Support\Collection;

class GetVendorProductRatesAction
{
    public function __construct(
        private AccVendorRepositoryInterface $repository,
    ) {
    }

    /** @param string[] $productUlids */
    public function execute(int $tenantId, AccVendor $vendor, array $productUlids): Collection
    {
        return $this->repository->findLatestRatesForProducts($tenantId, $vendor, $productUlids);
    }
}
