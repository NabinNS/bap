<?php

namespace App\Application\Categories\Actions;

use App\Domain\Categories\Repositories\CategoryRepositoryInterface;
use App\Models\Category;

class DeleteCategoryAction
{
    public function __construct(
        private CategoryRepositoryInterface $categories,
    ) {}

    public function execute(Category $category): void
    {
        $this->categories->delete($category);
    }
}
