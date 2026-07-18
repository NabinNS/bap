<?php

namespace App\Domain\Brands\Repositories;

use App\Domain\Brands\DTOs\BrandData;
use App\Domain\Brands\DTOs\BrandFilterData;
use App\Models\Brand;
use Illuminate\Pagination\LengthAwarePaginator;

interface BrandRepositoryInterface
{
    public function paginate(int $tenantId, int $perPage, BrandFilterData $filters): LengthAwarePaginator;

    public function findByUlid(int $tenantId, string $ulid): Brand;

    public function create(int $tenantId, BrandData $data): Brand;

    public function update(Brand $brand, BrandData $data): Brand;

    public function delete(Brand $brand): void;
}
