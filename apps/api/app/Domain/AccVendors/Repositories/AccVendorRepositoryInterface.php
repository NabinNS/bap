<?php

namespace App\Domain\AccVendors\Repositories;

use App\Domain\AccVendors\DTOs\AccVendorData;
use App\Domain\AccVendors\DTOs\AccVendorFilterData;
use App\Models\AccVendor;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

interface AccVendorRepositoryInterface
{
    public function paginate(int $tenantId, int $perPage, AccVendorFilterData $filters): LengthAwarePaginator;

    public function create(int $tenantId, AccVendorData $data): AccVendor;

    public function update(AccVendor $vendor, AccVendorData $data): AccVendor;

    public function delete(AccVendor $vendor): void;

    public function trashed(int $tenantId): Collection;

    /** @param int[] $ids @return Collection<int, AccVendor> */
    public function findByIds(int $tenantId, array $ids): Collection;

    public function restore(int $tenantId, string $vendorUlid): AccVendor;

    /** Products this vendor has previously supplied that are currently at/below their low-stock threshold. */
    public function findLowStockProductsPreviouslyPurchased(int $tenantId, AccVendor $vendor): Collection;

    /**
     * This vendor's most recent rate for each of the given products.
     *
     * @param string[] $productUlids
     * @return Collection<int, array{product_ulid: string, rate: int}>
     */
    public function findLatestRatesForProducts(int $tenantId, AccVendor $vendor, array $productUlids): Collection;
}
