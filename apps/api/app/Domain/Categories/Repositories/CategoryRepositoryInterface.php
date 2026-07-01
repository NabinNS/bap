<?php

namespace App\Domain\Categories\Repositories;

use App\Domain\Categories\DTOs\CategoryData;
use App\Models\Category;
use Illuminate\Pagination\LengthAwarePaginator;

interface CategoryRepositoryInterface
{
    public function paginate(int $tenantId, int $perPage): LengthAwarePaginator;

    public function findByUlid(int $tenantId, string $ulid): Category;

    public function create(int $tenantId, CategoryData $data): Category;

    public function update(Category $category, CategoryData $data): Category;

    public function delete(Category $category): void;
}
