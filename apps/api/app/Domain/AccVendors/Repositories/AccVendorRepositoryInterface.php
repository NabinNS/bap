<?php

namespace App\Domain\AccVendors\Repositories;

use App\Domain\AccVendors\DTOs\AccVendorData;
use App\Domain\AccVendors\DTOs\AccVendorFilterData;
use App\Models\AccVendor;
use Illuminate\Pagination\LengthAwarePaginator;

interface AccVendorRepositoryInterface
{
    public function paginate(int $tenantId, int $perPage, AccVendorFilterData $filters): LengthAwarePaginator;

    public function create(int $tenantId, AccVendorData $data): AccVendor;

    public function update(AccVendor $vendor, AccVendorData $data): AccVendor;

    public function delete(AccVendor $vendor): void;
}
