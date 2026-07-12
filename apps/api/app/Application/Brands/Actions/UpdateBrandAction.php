<?php

namespace App\Application\Brands\Actions;

use App\Domain\Brands\DTOs\BrandData;
use App\Domain\Brands\Repositories\BrandRepositoryInterface;
use App\Application\Shared\Services\SlugService;
use App\Models\Brand;

class UpdateBrandAction
{
    public function __construct(
        private BrandRepositoryInterface $brands,
        private SlugService $slugService,
    ) {}

    public function execute(Brand $brand, BrandData $data): Brand
    {
        $resolved = new BrandData(
            name:        $data->name,
            slug:        $this->slugService->resolve($data->slug, $data->name),
            description: $data->description,
            image:       $data->image,
            isActive:    $data->isActive,
            sortOrder:   $data->sortOrder,
        );

        return $this->brands->update($brand, $resolved);
    }
}
