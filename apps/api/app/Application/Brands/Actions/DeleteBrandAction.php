<?php

namespace App\Application\Brands\Actions;

use App\Domain\Brands\Repositories\BrandRepositoryInterface;
use App\Models\Brand;

class DeleteBrandAction
{
    public function __construct(
        private BrandRepositoryInterface $brands,
    ) {}

    public function execute(Brand $brand): void
    {
        $this->brands->delete($brand);
    }
}
