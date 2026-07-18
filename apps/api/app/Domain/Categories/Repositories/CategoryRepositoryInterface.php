<?php

namespace App\Domain\Categories\Repositories;

use App\Domain\Categories\DTOs\CategoryData;
use App\Domain\Categories\DTOs\CategoryFilterData;
use App\Models\Category;
use Illuminate\Pagination\LengthAwarePaginator;

interface CategoryRepositoryInterface
{
    public function paginate(int $tenantId, int $perPage, CategoryFilterData $filters): LengthAwarePaginator;

    public function findByUlid(int $tenantId, string $ulid): Category;

    public function create(int $tenantId, CategoryData $data): Category;

    public function update(Category $category, CategoryData $data): Category;

    public function delete(Category $category): void;
}
