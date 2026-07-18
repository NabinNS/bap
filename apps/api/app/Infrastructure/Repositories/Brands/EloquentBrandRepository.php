<?php

namespace App\Infrastructure\Repositories\Brands;

use App\Domain\Brands\DTOs\BrandData;
use App\Domain\Brands\DTOs\BrandFilterData;
use App\Domain\Brands\Repositories\BrandRepositoryInterface;
use App\Models\Brand;
use Illuminate\Pagination\LengthAwarePaginator;

class EloquentBrandRepository implements BrandRepositoryInterface
{
    public function paginate(int $tenantId, int $perPage, BrandFilterData $filters): LengthAwarePaginator
    {
        return Brand::where('tenant_id', $tenantId)
            ->with('imageGroups.imageItems')
            ->when($filters->search, fn($q, $v) => $q->where('name', 'like', "%$v%"))
            ->when($filters->isActive !== null, fn($q) => $q->where('is_active', $filters->isActive))
            ->orderBy($filters->sortBy, $filters->sortDir)
            ->paginate($perPage);
    }

    public function findByUlid(int $tenantId, string $ulid): Brand
    {
        return Brand::where('tenant_id', $tenantId)
            ->where('ulid', $ulid)
            ->firstOrFail();
    }

    public function create(int $tenantId, BrandData $data): Brand
    {
        return Brand::create([
            'tenant_id'   => $tenantId,
            'name'        => $data->name,
            'slug'        => $data->slug,
            'description' => $data->description,
            'is_active'   => $data->isActive,
            'sort_order'  => $data->sortOrder,
        ]);
    }

    public function update(Brand $brand, BrandData $data): Brand
    {
        $brand->update([
            'name'        => $data->name,
            'slug'        => $data->slug,
            'description' => $data->description,
            'is_active'   => $data->isActive,
            'sort_order'  => $data->sortOrder,
        ]);

        return $brand->fresh();
    }

    public function delete(Brand $brand): void
    {
        $brand->delete();
    }
}
