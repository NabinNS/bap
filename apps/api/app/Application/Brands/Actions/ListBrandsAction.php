<?php

namespace App\Application\Brands\Actions;

use App\Domain\Brands\DTOs\BrandFilterData;
use App\Domain\Brands\Repositories\BrandRepositoryInterface;
use Illuminate\Pagination\LengthAwarePaginator;

class ListBrandsAction
{
    public function __construct(
        private BrandRepositoryInterface $brands,
    ) {}

    public function execute(int $tenantId, int $perPage = 15, BrandFilterData $filters = new BrandFilterData()): LengthAwarePaginator
    {
        return $this->brands->paginate($tenantId, $perPage, $filters);
    }
}
