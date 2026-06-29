<?php

namespace App\Application\Categories\Actions;

use App\Domain\Categories\DTOs\CategoryData;
use App\Domain\Categories\Repositories\CategoryRepositoryInterface;
use App\Domain\Categories\Services\SlugService;
use App\Models\Category;

class UpdateCategoryAction
{
    public function __construct(
        private CategoryRepositoryInterface $categories,
        private SlugService $slugService,
    ) {}

    public function execute(Category $category, CategoryData $data): Category
    {
        $resolved = new CategoryData(
            name:        $data->name,
            slug:        $this->slugService->resolve($data->slug, $data->name),
            description: $data->description,
            image:       $data->image,
            isActive:    $data->isActive,
            sortOrder:   $data->sortOrder,
        );

        return $this->categories->update($category, $resolved);
    }
}
