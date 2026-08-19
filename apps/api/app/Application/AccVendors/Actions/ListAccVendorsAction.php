<?php

namespace App\Application\AccVendors\Actions;

use App\Domain\AccVendors\DTOs\AccVendorFilterData;
use App\Domain\AccVendors\Repositories\AccVendorRepositoryInterface;
use Illuminate\Pagination\LengthAwarePaginator;

class ListAccVendorsAction
{
    public function __construct(
        private AccVendorRepositoryInterface $vendors,
    ) {}

    public function execute(int $tenantId, int $perPage = 15, AccVendorFilterData $filters = new AccVendorFilterData()): LengthAwarePaginator
    {
        return $this->vendors->paginate($tenantId, $perPage, $filters);
    }
}
