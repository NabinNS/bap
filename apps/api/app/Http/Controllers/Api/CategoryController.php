<?php

namespace App\Http\Controllers\Api;

use App\Application\Categories\Actions\CreateCategoryAction;
use App\Application\Categories\Actions\DeleteCategoryAction;
use App\Application\Categories\Actions\ListCategoriesAction;
use App\Application\Categories\Actions\UpdateCategoryAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Categories\StoreCategoryRequest;
use App\Http\Requests\Categories\UpdateCategoryRequest;
use App\Http\Resources\ApiResponse;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    public function index(Request $request, ListCategoriesAction $action): JsonResponse
    {
        return ApiResponse::paginated(
            $action->execute($request->user()->currentTenantId(), $request->integer('per_page', 15)),
            'Categories retrieved successfully'
        );
    }

    public function store(StoreCategoryRequest $request, CreateCategoryAction $action): JsonResponse
    {
        return ApiResponse::created(
            $action->execute($request->user()->currentTenantId(), $request->toDTO()),
            'Category created successfully'
        );
    }

    public function show(Request $request, Category $category): JsonResponse
    {
        $this->authorize('view', $category);

        return ApiResponse::success($category, 'Category retrieved successfully');
    }

    public function update(UpdateCategoryRequest $request, Category $category, UpdateCategoryAction $action): JsonResponse
    {
        $this->authorize('update', $category);

        return ApiResponse::success(
            $action->execute($category, $request->toDTO()),
            'Category updated successfully'
        );
    }

    public function destroy(Request $request, Category $category, DeleteCategoryAction $action): JsonResponse
    {
        $this->authorize('delete', $category);

        $action->execute($category);

        return ApiResponse::noContent('Category deleted successfully');
    }
}
