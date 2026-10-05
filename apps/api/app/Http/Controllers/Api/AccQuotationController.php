<?php

namespace App\Http\Controllers\Api;

use App\Application\AccQuotations\Actions\AddAccQuotationItemAction;
use App\Application\AccQuotations\Actions\DeleteAccQuotationAction;
use App\Application\AccQuotations\Actions\DeleteAccQuotationItemAction;
use App\Application\AccQuotations\Actions\ListAccQuotationsAction;
use App\Application\AccQuotations\Actions\ListAllQuotationsAction;
use App\Application\AccQuotations\Actions\ListTrashedAccQuotationItemsAction;
use App\Application\AccQuotations\Actions\ListTrashedAccQuotationsAction;
use App\Application\AccQuotations\Actions\ListTrashedAllQuotationsAction;
use App\Application\AccQuotations\Actions\RecalculateAccQuotationTotalsAction;
use App\Application\AccQuotations\Actions\RestoreAccQuotationAction;
use App\Application\AccQuotations\Actions\RestoreAccQuotationItemAction;
use App\Application\AccQuotations\Actions\StoreAccQuotationAction;
use App\Application\AccQuotations\Actions\UpdateAccQuotationAction;
use App\Application\AccQuotations\Actions\UpdateAccQuotationItemAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\AccQuotations\StoreAccQuotationItemRequest;
use App\Http\Requests\AccQuotations\StoreAccQuotationRequest;
use App\Http\Requests\AccQuotations\UpdateAccQuotationRequest;
use App\Http\Requests\AccQuotations\UpdateAccQuotationTotalsRequest;
use App\Http\Resources\AccQuotations\AccQuotationItemResource;
use App\Http\Resources\AccQuotations\AccQuotationResource;
use App\Http\Resources\ApiResponse;
use App\Models\AccCustomer;
use App\Models\AccQuotation;
use App\Models\AccQuotationItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AccQuotationController extends Controller
{
    public function allQuotations(Request $request, ListAllQuotationsAction $action): JsonResponse
    {
        return ApiResponse::paginated(
            $action->execute($this->tenantId(), $request->integer('per_page', 50), $request->integer('fiscal_year_id') ?: null),
            AccQuotationResource::class,
            'Quotations retrieved successfully'
        );
    }

    public function trashedAllQuotations(Request $request, ListTrashedAllQuotationsAction $action): JsonResponse
    {
        return ApiResponse::success(
            AccQuotationResource::collection($action->execute($this->tenantId(), $request->integer('fiscal_year_id') ?: null)),
            'Trashed quotations retrieved successfully'
        );
    }

    public function index(Request $request, AccCustomer $accCustomer, ListAccQuotationsAction $action): JsonResponse
    {
        $this->authorize('view', $accCustomer);

        return ApiResponse::paginated(
            $action->execute($accCustomer, $request->integer('per_page', 50), $request->integer('fiscal_year_id') ?: null),
            AccQuotationResource::class,
            'Quotations retrieved successfully'
        );
    }

    public function trashed(Request $request, AccCustomer $accCustomer, ListTrashedAccQuotationsAction $action): JsonResponse
    {
        $this->authorize('view', $accCustomer);

        return ApiResponse::success(
            AccQuotationResource::collection($action->execute($accCustomer, $request->integer('fiscal_year_id') ?: null)),
            'Trashed quotations retrieved successfully'
        );
    }

    public function restore(AccCustomer $accCustomer, string $quotationUlid, RestoreAccQuotationAction $action): JsonResponse
    {
        $this->authorize('update', $accCustomer);

        $quotation = $action->execute($this->tenantId(), $quotationUlid);

        return ApiResponse::success(new AccQuotationResource($quotation), 'Quotation restored successfully');
    }

    public function store(StoreAccQuotationRequest $request, AccCustomer $accCustomer, StoreAccQuotationAction $action): JsonResponse
    {
        $this->authorize('update', $accCustomer);

        $quotation = $action->execute($this->tenantId(), $accCustomer, $request->toDTO());

        return ApiResponse::success(
            new AccQuotationResource($quotation),
            'Quotation created successfully',
            201
        );
    }

    public function storeItem(
        StoreAccQuotationItemRequest $request,
        AccCustomer $accCustomer,
        AccQuotation $quotation,
        AddAccQuotationItemAction $action
    ): JsonResponse {
        $this->authorize('update', $accCustomer);
        abort_unless($quotation->customer_id === $accCustomer->id, 404);

        $item = $action->execute($this->tenantId(), $quotation, $request->toDTO());

        return ApiResponse::success(
            new AccQuotationItemResource($item),
            'Item recorded successfully',
            201
        );
    }

    public function updateTotals(
        UpdateAccQuotationTotalsRequest $request,
        AccCustomer $accCustomer,
        AccQuotation $quotation,
        RecalculateAccQuotationTotalsAction $action
    ): JsonResponse {
        $this->authorize('update', $accCustomer);
        abort_unless($quotation->customer_id === $accCustomer->id, 404);

        $updated = $action->execute(
            $quotation,
            $request->filled('discount_percent') ? $request->integer('discount_percent') : null,
            $request->filled('discount_amount') ? $request->integer('discount_amount') : null,
        );

        return ApiResponse::success(
            new AccQuotationResource($updated),
            'Totals updated successfully'
        );
    }

    public function update(
        UpdateAccQuotationRequest $request,
        AccCustomer $accCustomer,
        AccQuotation $quotation,
        UpdateAccQuotationAction $action
    ): JsonResponse {
        $this->authorize('update', $accCustomer);
        abort_unless($quotation->customer_id === $accCustomer->id, 404);

        $updated = $action->execute($quotation, $request->toDTO());

        return ApiResponse::success(new AccQuotationResource($updated), 'Quotation updated successfully');
    }

    public function destroy(
        AccCustomer $accCustomer,
        AccQuotation $quotation,
        DeleteAccQuotationAction $action
    ): JsonResponse {
        $this->authorize('update', $accCustomer);
        abort_unless($quotation->customer_id === $accCustomer->id, 404);

        $action->execute($quotation);

        return ApiResponse::noContent('Quotation deleted successfully');
    }

    public function updateItem(
        StoreAccQuotationItemRequest $request,
        AccCustomer $accCustomer,
        AccQuotation $quotation,
        AccQuotationItem $item,
        UpdateAccQuotationItemAction $action
    ): JsonResponse {
        $this->authorize('update', $accCustomer);
        abort_unless($quotation->customer_id === $accCustomer->id, 404);
        abort_unless($item->quotation_id === $quotation->id, 404);

        $updated = $action->execute($this->tenantId(), $quotation, $item, $request->toDTO());

        return ApiResponse::success(new AccQuotationItemResource($updated), 'Item updated successfully');
    }

    public function destroyItem(
        AccCustomer $accCustomer,
        AccQuotation $quotation,
        AccQuotationItem $item,
        DeleteAccQuotationItemAction $action
    ): JsonResponse {
        $this->authorize('update', $accCustomer);
        abort_unless($quotation->customer_id === $accCustomer->id, 404);
        abort_unless($item->quotation_id === $quotation->id, 404);

        $action->execute($quotation, $item);

        return ApiResponse::noContent('Item deleted successfully');
    }

    public function trashedItems(
        AccCustomer $accCustomer,
        AccQuotation $quotation,
        ListTrashedAccQuotationItemsAction $action
    ): JsonResponse {
        $this->authorize('view', $accCustomer);
        abort_unless($quotation->customer_id === $accCustomer->id, 404);

        return ApiResponse::success(
            AccQuotationItemResource::collection($action->execute($quotation)),
            'Trashed items retrieved successfully'
        );
    }

    public function restoreItem(
        AccCustomer $accCustomer,
        AccQuotation $quotation,
        string $itemUlid,
        RestoreAccQuotationItemAction $action
    ): JsonResponse {
        $this->authorize('update', $accCustomer);
        abort_unless($quotation->customer_id === $accCustomer->id, 404);

        $item = $action->execute($this->tenantId(), $quotation, $itemUlid);

        return ApiResponse::success(new AccQuotationItemResource($item), 'Item restored successfully');
    }
}
