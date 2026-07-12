<?php

namespace App\Application\Brands\Actions;

use App\Domain\Brands\DTOs\BrandData;
use App\Domain\Brands\Repositories\BrandRepositoryInterface;
use App\Application\Shared\Services\SlugService;
use App\Models\Brand;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Validation\ValidationException;

class CreateBrandAction
{
    public function __construct(
        private BrandRepositoryInterface $brands,
        private SlugService $slugService,
    ) {}

    public function execute(int $tenantId, BrandData $data): Brand
    {
        $resolved = new BrandData(
            name:        $data->name,
            slug:        $this->slugService->resolve($data->slug, $data->name),
            description: $data->description,
            image:       $data->image,
            isActive:    $data->isActive,
            sortOrder:   $data->sortOrder,
        );

        try {
            return $this->brands->create($tenantId, $resolved);
        } catch (UniqueConstraintViolationException) {
            throw ValidationException::withMessages([
                'slug' => ['A brand with this slug already exists.'],
            ]);
        }
    }
}
