<?php

namespace App\Http\Controllers\Api;

use App\Application\Brands\Actions\CreateBrandAction;
use App\Application\Brands\Actions\DeleteBrandAction;
use App\Application\Brands\Actions\ListBrandsAction;
use App\Application\Brands\Actions\UpdateBrandAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Brands\StoreBrandRequest;
use App\Http\Requests\Brands\UpdateBrandRequest;
use App\Http\Resources\ApiResponse;
use App\Http\Resources\Brands\BrandResource;
use App\Models\Brand;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BrandController extends Controller
{
    public function index(Request $request, ListBrandsAction $action): JsonResponse
    {
        return ApiResponse::paginated(
            $action->execute(app('current_tenant')->id, $request->integer('per_page', 15)),
            BrandResource::class,
            'Brands retrieved successfully'
        );
    }

    public function store(StoreBrandRequest $request, CreateBrandAction $action): JsonResponse
    {
        return ApiResponse::created(
            new BrandResource($action->execute($request->user()->currentTenantId(), $request->toDTO())),
            'Brand created successfully'
        );
    }

    public function show(Request $request, Brand $brand): JsonResponse
    {
        if ($request->user()) {
            $this->authorize('view', $brand);
        }

        return ApiResponse::success(new BrandResource($brand), 'Brand retrieved successfully');
    }

    public function update(UpdateBrandRequest $request, Brand $brand, UpdateBrandAction $action): JsonResponse
    {
        $this->authorize('update', $brand);

        return ApiResponse::success(
            new BrandResource($action->execute($brand, $request->toDTO())),
            'Brand updated successfully'
        );
    }

    public function destroy(Request $request, Brand $brand, DeleteBrandAction $action): JsonResponse
    {
        $this->authorize('delete', $brand);

        $action->execute($brand);

        return ApiResponse::noContent('Brand deleted successfully');
    }
}
