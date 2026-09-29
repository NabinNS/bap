<?php

namespace App\Http\Controllers\Api;

use App\Application\AccCustomers\Actions\CreateAccCustomerAction;
use App\Application\AccCustomers\Actions\DeleteAccCustomerAction;
use App\Application\AccCustomers\Actions\ListAccCustomersAction;
use App\Application\AccCustomers\Actions\ListTrashedAccCustomersAction;
use App\Application\AccCustomers\Actions\RestoreAccCustomerAction;
use App\Application\AccCustomers\Actions\UpdateAccCustomerAction;
use App\Domain\AccCustomers\DTOs\AccCustomerFilterData;
use App\Http\Controllers\Controller;
use App\Http\Requests\AccCustomers\StoreAccCustomerRequest;
use App\Http\Requests\AccCustomers\UpdateAccCustomerRequest;
use App\Http\Resources\ApiResponse;
use App\Http\Resources\AccCustomers\AccCustomerResource;
use App\Models\AccCustomer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AccCustomerController extends Controller
{
    public function index(Request $request, ListAccCustomersAction $action): JsonResponse
    {
        return ApiResponse::paginated(
            $action->execute($this->tenantId(), $request->integer('per_page', 15), AccCustomerFilterData::fromRequest($request)),
            AccCustomerResource::class,
            'Customers retrieved successfully'
        );
    }

    public function show(Request $request, AccCustomer $accCustomer): JsonResponse
    {
        $this->authorize('view', $accCustomer);

        return ApiResponse::success(new AccCustomerResource($accCustomer), 'Customer retrieved successfully');
    }

    public function store(StoreAccCustomerRequest $request, CreateAccCustomerAction $action): JsonResponse
    {
        return ApiResponse::created(
            new AccCustomerResource($action->execute($this->tenantId(), $request->toDTO())),
            'Customer created successfully'
        );
    }

    public function update(UpdateAccCustomerRequest $request, AccCustomer $accCustomer, UpdateAccCustomerAction $action): JsonResponse
    {
        $this->authorize('update', $accCustomer);

        return ApiResponse::success(
            new AccCustomerResource($action->execute($accCustomer, $request->toDTO())),
            'Customer updated successfully'
        );
    }

    public function destroy(Request $request, AccCustomer $accCustomer, DeleteAccCustomerAction $action): JsonResponse
    {
        $this->authorize('delete', $accCustomer);

        $action->execute($accCustomer);

        return ApiResponse::noContent('Customer deleted successfully');
    }

    public function trashed(ListTrashedAccCustomersAction $action): JsonResponse
    {
        return ApiResponse::success(
            AccCustomerResource::collection($action->execute($this->tenantId())),
            'Trashed customers retrieved successfully'
        );
    }

    public function restore(Request $request, string $customerUlid, RestoreAccCustomerAction $action): JsonResponse
    {
        return ApiResponse::success(
            new AccCustomerResource($action->execute($this->tenantId(), $customerUlid)),
            'Customer restored successfully'
        );
    }
}
