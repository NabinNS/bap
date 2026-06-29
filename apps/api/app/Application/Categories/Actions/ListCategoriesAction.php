<?php

namespace App\Application\Categories\Actions;

use App\Domain\Categories\Repositories\CategoryRepositoryInterface;
use Illuminate\Pagination\LengthAwarePaginator;

class ListCategoriesAction
{
    public function __construct(
        private CategoryRepositoryInterface $categories,
    ) {}

    public function execute(int $tenantId, int $perPage = 15): LengthAwarePaginator
    {
        return $this->categories->paginate($tenantId, $perPage);
    }
}
