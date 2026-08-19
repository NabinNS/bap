<?php

namespace App\Http\Controllers\Api;

use App\Application\AccVendors\Actions\CreateAccVendorAction;
use App\Application\AccVendors\Actions\DeleteAccVendorAction;
use App\Application\AccVendors\Actions\ListAccVendorsAction;
use App\Application\AccVendors\Actions\UpdateAccVendorAction;
use App\Domain\AccVendors\DTOs\AccVendorFilterData;
use App\Http\Controllers\Controller;
use App\Http\Requests\AccVendors\StoreAccVendorRequest;
use App\Http\Requests\AccVendors\UpdateAccVendorRequest;
use App\Http\Resources\ApiResponse;
use App\Http\Resources\AccVendors\AccVendorResource;
use App\Models\AccVendor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AccVendorController extends Controller
{
    public function index(Request $request, ListAccVendorsAction $action): JsonResponse
    {
        return ApiResponse::paginated(
            $action->execute($this->tenantId(), $request->integer('per_page', 15), AccVendorFilterData::fromRequest($request)),
            AccVendorResource::class,
            'Vendors retrieved successfully'
        );
    }

    public function show(Request $request, AccVendor $accVendor): JsonResponse
    {
        $this->authorize('view', $accVendor);

        return ApiResponse::success(new AccVendorResource($accVendor), 'Vendor retrieved successfully');
    }

    public function store(StoreAccVendorRequest $request, CreateAccVendorAction $action): JsonResponse
    {
        return ApiResponse::created(
            new AccVendorResource($action->execute($this->tenantId(), $request->toDTO())),
            'Vendor created successfully'
        );
    }

    public function update(UpdateAccVendorRequest $request, AccVendor $accVendor, UpdateAccVendorAction $action): JsonResponse
    {
        $this->authorize('update', $accVendor);

        return ApiResponse::success(
            new AccVendorResource($action->execute($accVendor, $request->toDTO())),
            'Vendor updated successfully'
        );
    }

    public function destroy(Request $request, AccVendor $accVendor, DeleteAccVendorAction $action): JsonResponse
    {
        $this->authorize('delete', $accVendor);

        $action->execute($accVendor);

        return ApiResponse::noContent('Vendor deleted successfully');
    }
}
