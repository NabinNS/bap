<?php

namespace App\Infrastructure\Repositories\Categories;

use App\Domain\Categories\DTOs\CategoryData;
use App\Domain\Categories\DTOs\CategoryFilterData;
use App\Domain\Categories\Repositories\CategoryRepositoryInterface;
use App\Models\Category;
use Illuminate\Pagination\LengthAwarePaginator;

class EloquentCategoryRepository implements CategoryRepositoryInterface
{
    public function paginate(int $tenantId, int $perPage, CategoryFilterData $filters): LengthAwarePaginator
    {
        return Category::where('tenant_id', $tenantId)
            ->with(['imageGroups.imageItems'])
            ->when($filters->search, fn($q, $v) => $q->where('name', 'like', "%$v%"))
            ->when($filters->isActive !== null, fn($q) => $q->where('is_active', $filters->isActive))
            ->orderBy($filters->sortBy, $filters->sortDir)
            ->paginate($perPage);
    }

    public function findByUlid(int $tenantId, string $ulid): Category
    {
        return Category::where('tenant_id', $tenantId)
            ->where('ulid', $ulid)
            ->firstOrFail();
    }

    public function create(int $tenantId, CategoryData $data): Category
    {
        return Category::create([
            'tenant_id'   => $tenantId,
            'name'        => $data->name,
            'slug'        => $data->slug,
            'description' => $data->description,
            'image'       => $data->image,
            'is_active'   => $data->isActive,
            'sort_order'  => $data->sortOrder,
        ]);
    }

    public function update(Category $category, CategoryData $data): Category
    {
        $category->update([
            'name'        => $data->name,
            'slug'        => $data->slug,
            'description' => $data->description,
            'image'       => $data->image,
            'is_active'   => $data->isActive,
            'sort_order'  => $data->sortOrder,
        ]);

        return $category->fresh();
    }

    public function delete(Category $category): void
    {
        $category->delete();
    }
}
