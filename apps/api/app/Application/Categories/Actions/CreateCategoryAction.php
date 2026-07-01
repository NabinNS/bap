<?php

namespace App\Application\Categories\Actions;

use App\Domain\Categories\DTOs\CategoryData;
use App\Domain\Categories\Repositories\CategoryRepositoryInterface;
use App\Application\Shared\Services\SlugService;
use App\Models\Category;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Validation\ValidationException;

class CreateCategoryAction
{
    public function __construct(
        private CategoryRepositoryInterface $categories,
        private SlugService $slugService,
    ) {}

    public function execute(int $tenantId, CategoryData $data): Category
    {
        $resolved = new CategoryData(
            name:        $data->name,
            slug:        $this->slugService->resolve($data->slug, $data->name),
            description: $data->description,
            image:       $data->image,
            isActive:    $data->isActive,
            sortOrder:   $data->sortOrder,
        );

        try {
            return $this->categories->create($tenantId, $resolved);
        } catch (UniqueConstraintViolationException) {
            throw ValidationException::withMessages([
                'slug' => ['A category with this slug already exists.'],
            ]);
        }
    }
}
