<?php

namespace App\Http\Controllers\Api;

use App\Application\AccVendors\Actions\AddAccVendorTransactionItemAction;
use App\Application\AccVendors\Actions\DeleteAccVendorTransactionAction;
use App\Application\AccVendors\Actions\DeleteAccVendorTransactionItemAction;
use App\Application\AccVendors\Actions\ListAccVendorTransactionsAction;
use App\Application\AccVendors\Actions\RecalculateAccVendorTransactionTotalsAction;
use App\Application\AccVendors\Actions\StoreAccVendorTransactionAction;
use App\Application\AccVendors\Actions\UpdateAccVendorTransactionAction;
use App\Application\AccVendors\Actions\UpdateAccVendorTransactionItemAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\AccVendors\StoreAccVendorTransactionItemRequest;
use App\Http\Requests\AccVendors\StoreAccVendorTransactionRequest;
use App\Http\Requests\AccVendors\UpdateAccVendorTransactionRequest;
use App\Http\Requests\AccVendors\UpdateAccVendorTransactionTotalsRequest;
use App\Http\Resources\AccVendors\AccVendorTransactionItemResource;
use App\Http\Resources\AccVendors\AccVendorTransactionResource;
use App\Http\Resources\ApiResponse;
use App\Models\AccVendor;
use App\Models\AccVendorTransaction;
use App\Models\AccVendorTransactionItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AccVendorTransactionController extends Controller
{
    public function index(Request $request, AccVendor $accVendor, ListAccVendorTransactionsAction $action): JsonResponse
    {
        $this->authorize('view', $accVendor);

        return ApiResponse::paginated(
            $action->execute($accVendor, $request->integer('per_page', 50)),
            AccVendorTransactionResource::class,
            'Transactions retrieved successfully'
        );
    }

    public function store(StoreAccVendorTransactionRequest $request, AccVendor $accVendor, StoreAccVendorTransactionAction $action): JsonResponse
    {
        $this->authorize('update', $accVendor);

        $transaction = $action->execute($this->tenantId(), $accVendor, $request->toDTO());

        return ApiResponse::success(
            new AccVendorTransactionResource($transaction),
            'Transaction created successfully',
            201
        );
    }

    public function storeItem(
        StoreAccVendorTransactionItemRequest $request,
        AccVendor $accVendor,
        AccVendorTransaction $transaction,
        AddAccVendorTransactionItemAction $action
    ): JsonResponse {
        $this->authorize('update', $accVendor);
        abort_unless($transaction->vendor_id === $accVendor->id, 404);

        $item = $action->execute($this->tenantId(), $accVendor, $transaction, $request->toDTO());

        return ApiResponse::success(
            new AccVendorTransactionItemResource($item),
            'Item recorded successfully',
            201
        );
    }

    public function updateTotals(
        UpdateAccVendorTransactionTotalsRequest $request,
        AccVendor $accVendor,
        AccVendorTransaction $transaction,
        RecalculateAccVendorTransactionTotalsAction $action
    ): JsonResponse {
        $this->authorize('update', $accVendor);
        abort_unless($transaction->vendor_id === $accVendor->id, 404);

        $updated = $action->execute(
            $accVendor,
            $transaction,
            $request->filled('discount_percent') ? $request->integer('discount_percent') : null,
            $request->filled('discount_amount') ? $request->integer('discount_amount') : null,
        );

        return ApiResponse::success(
            new AccVendorTransactionResource($updated),
            'Totals updated successfully'
        );
    }

    public function update(
        UpdateAccVendorTransactionRequest $request,
        AccVendor $accVendor,
        AccVendorTransaction $transaction,
        UpdateAccVendorTransactionAction $action
    ): JsonResponse {
        $this->authorize('update', $accVendor);
        abort_unless($transaction->vendor_id === $accVendor->id, 404);

        $updated = $action->execute($accVendor, $transaction, $request->toDTO());

        return ApiResponse::success(new AccVendorTransactionResource($updated), 'Transaction updated successfully');
    }

    public function destroy(
        AccVendor $accVendor,
        AccVendorTransaction $transaction,
        DeleteAccVendorTransactionAction $action
    ): JsonResponse {
        $this->authorize('update', $accVendor);
        abort_unless($transaction->vendor_id === $accVendor->id, 404);

        $action->execute($this->tenantId(), $accVendor, $transaction);

        return ApiResponse::noContent('Transaction deleted successfully');
    }

    public function updateItem(
        StoreAccVendorTransactionItemRequest $request,
        AccVendor $accVendor,
        AccVendorTransaction $transaction,
        AccVendorTransactionItem $item,
        UpdateAccVendorTransactionItemAction $action
    ): JsonResponse {
        $this->authorize('update', $accVendor);
        abort_unless($transaction->vendor_id === $accVendor->id, 404);
        abort_unless($item->transaction_id === $transaction->id, 404);

        $updated = $action->execute($this->tenantId(), $accVendor, $transaction, $item, $request->toDTO());

        return ApiResponse::success(new AccVendorTransactionItemResource($updated), 'Item updated successfully');
    }

    public function destroyItem(
        AccVendor $accVendor,
        AccVendorTransaction $transaction,
        AccVendorTransactionItem $item,
        DeleteAccVendorTransactionItemAction $action
    ): JsonResponse {
        $this->authorize('update', $accVendor);
        abort_unless($transaction->vendor_id === $accVendor->id, 404);
        abort_unless($item->transaction_id === $transaction->id, 404);

        $action->execute($this->tenantId(), $accVendor, $transaction, $item);

        return ApiResponse::noContent('Item deleted successfully');
    }
}
