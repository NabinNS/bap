<?php

namespace App\Http\Controllers\Api;

use App\Application\AccVendors\Actions\CreateAccVendorAction;
use App\Application\AccVendors\Actions\DeleteAccVendorAction;
use App\Application\AccVendors\Actions\GetVendorLowStockSuggestionsAction;
use App\Application\AccVendors\Actions\GetVendorProductRatesAction;
use App\Application\AccVendors\Actions\ListAccVendorsAction;
use App\Application\AccVendors\Actions\ListTrashedAccVendorsAction;
use App\Application\AccVendors\Actions\RestoreAccVendorAction;
use App\Application\AccVendors\Actions\UpdateAccVendorAction;
use App\Domain\AccVendors\DTOs\AccVendorFilterData;
use App\Http\Controllers\Controller;
use App\Http\Requests\AccVendors\StoreAccVendorRequest;
use App\Http\Requests\AccVendors\UpdateAccVendorRequest;
use App\Http\Resources\ApiResponse;
use App\Http\Resources\AccVendors\AccVendorResource;
use App\Http\Resources\Products\ProductLiteResource;
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

    public function lowStockSuggestions(AccVendor $accVendor, GetVendorLowStockSuggestionsAction $action): JsonResponse
    {
        $this->authorize('view', $accVendor);

        return ApiResponse::success(
            ProductLiteResource::collection($action->execute($this->tenantId(), $accVendor)),
            'Low-stock suggestions retrieved successfully'
        );
    }

    public function productRates(Request $request, AccVendor $accVendor, GetVendorProductRatesAction $action): JsonResponse
    {
        $this->authorize('view', $accVendor);

        $productUlids = array_filter((array) $request->query('product_ulids', []));

        return ApiResponse::success(
            $action->execute($this->tenantId(), $accVendor, $productUlids)->values(),
            'Vendor product rates retrieved successfully'
        );
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

    public function trashed(ListTrashedAccVendorsAction $action): JsonResponse
    {
        return ApiResponse::success(
            AccVendorResource::collection($action->execute($this->tenantId())),
            'Trashed vendors retrieved successfully'
        );
    }

    public function restore(Request $request, string $vendorUlid, RestoreAccVendorAction $action): JsonResponse
    {
        return ApiResponse::success(
            new AccVendorResource($action->execute($this->tenantId(), $vendorUlid)),
            'Vendor restored successfully'
        );
    }
}
