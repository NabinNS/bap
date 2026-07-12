<?php

namespace App\Domain\Brands\Repositories;

use App\Domain\Brands\DTOs\BrandData;
use App\Models\Brand;
use Illuminate\Pagination\LengthAwarePaginator;

interface BrandRepositoryInterface
{
    public function paginate(int $tenantId, int $perPage): LengthAwarePaginator;

    public function findByUlid(int $tenantId, string $ulid): Brand;

    public function create(int $tenantId, BrandData $data): Brand;

    public function update(Brand $brand, BrandData $data): Brand;

    public function delete(Brand $brand): void;
}
