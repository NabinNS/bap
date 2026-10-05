<?php

namespace App\Http\Controllers\Api;

use App\Application\AccCustomers\Actions\AddAccCustomerTransactionItemAction;
use App\Application\AccCustomers\Actions\DeleteAccCustomerTransactionAction;
use App\Application\AccCustomers\Actions\DeleteAccCustomerTransactionItemAction;
use App\Application\AccCustomers\Actions\ListAccCustomerTransactionsAction;
use App\Application\AccCustomers\Actions\ListSalesBillsAction;
use App\Application\AccCustomers\Actions\ListTrashedAccCustomerTransactionItemsAction;
use App\Application\AccCustomers\Actions\ListTrashedAccCustomerTransactionsAction;
use App\Application\AccCustomers\Actions\ListTrashedSalesBillsAction;
use App\Application\AccCustomers\Actions\RecalculateAccCustomerTransactionTotalsAction;
use App\Application\AccCustomers\Actions\RestoreAccCustomerTransactionAction;
use App\Application\AccCustomers\Actions\RestoreAccCustomerTransactionItemAction;
use App\Application\AccCustomers\Actions\StoreAccCustomerTransactionAction;
use App\Application\AccCustomers\Actions\UpdateAccCustomerTransactionAction;
use App\Application\AccCustomers\Actions\UpdateAccCustomerTransactionItemAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\AccCustomers\StoreAccCustomerTransactionItemRequest;
use App\Http\Requests\AccCustomers\StoreAccCustomerTransactionRequest;
use App\Http\Requests\AccCustomers\UpdateAccCustomerTransactionRequest;
use App\Http\Requests\AccCustomers\UpdateAccCustomerTransactionTotalsRequest;
use App\Http\Resources\AccCustomers\AccCustomerTransactionItemResource;
use App\Http\Resources\AccCustomers\AccCustomerTransactionResource;
use App\Http\Resources\ApiResponse;
use App\Models\AccCustomer;
use App\Models\AccCustomerTransaction;
use App\Models\AccCustomerTransactionItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AccCustomerTransactionController extends Controller
{
    public function salesBills(Request $request, ListSalesBillsAction $action): JsonResponse
    {
        return ApiResponse::paginated(
            $action->execute($this->tenantId(), $request->integer('per_page', 50), $request->integer('fiscal_year_id') ?: null),
            AccCustomerTransactionResource::class,
            'Sales bills retrieved successfully'
        );
    }

    public function trashedSalesBills(Request $request, ListTrashedSalesBillsAction $action): JsonResponse
    {
        return ApiResponse::success(
            AccCustomerTransactionResource::collection($action->execute($this->tenantId(), $request->integer('fiscal_year_id') ?: null)),
            'Trashed sales bills retrieved successfully'
        );
    }

    public function index(Request $request, AccCustomer $accCustomer, ListAccCustomerTransactionsAction $action): JsonResponse
    {
        $this->authorize('view', $accCustomer);

        return ApiResponse::paginated(
            $action->execute($accCustomer, $request->integer('per_page', 50), $request->integer('fiscal_year_id') ?: null),
            AccCustomerTransactionResource::class,
            'Transactions retrieved successfully'
        );
    }

    public function trashed(Request $request, AccCustomer $accCustomer, ListTrashedAccCustomerTransactionsAction $action): JsonResponse
    {
        $this->authorize('view', $accCustomer);

        return ApiResponse::success(
            AccCustomerTransactionResource::collection($action->execute($accCustomer, $request->integer('fiscal_year_id') ?: null)),
            'Trashed transactions retrieved successfully'
        );
    }

    public function restore(AccCustomer $accCustomer, string $transactionUlid, RestoreAccCustomerTransactionAction $action): JsonResponse
    {
        $this->authorize('update', $accCustomer);

        $transaction = $action->execute($this->tenantId(), $accCustomer, $transactionUlid);

        return ApiResponse::success(new AccCustomerTransactionResource($transaction), 'Transaction restored successfully');
    }

    public function store(StoreAccCustomerTransactionRequest $request, AccCustomer $accCustomer, StoreAccCustomerTransactionAction $action): JsonResponse
    {
        $this->authorize('update', $accCustomer);

        $transaction = $action->execute($this->tenantId(), $accCustomer, $request->toDTO());

        return ApiResponse::success(
            new AccCustomerTransactionResource($transaction),
            'Transaction created successfully',
            201
        );
    }

    public function storeItem(
        StoreAccCustomerTransactionItemRequest $request,
        AccCustomer $accCustomer,
        AccCustomerTransaction $transaction,
        AddAccCustomerTransactionItemAction $action
    ): JsonResponse {
        $this->authorize('update', $accCustomer);
        abort_unless($transaction->customer_id === $accCustomer->id, 404);

        $item = $action->execute($this->tenantId(), $accCustomer, $transaction, $request->toDTO());

        return ApiResponse::success(
            new AccCustomerTransactionItemResource($item),
            'Item recorded successfully',
            201
        );
    }

    public function updateTotals(
        UpdateAccCustomerTransactionTotalsRequest $request,
        AccCustomer $accCustomer,
        AccCustomerTransaction $transaction,
        RecalculateAccCustomerTransactionTotalsAction $action
    ): JsonResponse {
        $this->authorize('update', $accCustomer);
        abort_unless($transaction->customer_id === $accCustomer->id, 404);

        $updated = $action->execute(
            $accCustomer,
            $transaction,
            $request->filled('discount_percent') ? $request->integer('discount_percent') : null,
            $request->filled('discount_amount') ? $request->integer('discount_amount') : null,
        );

        return ApiResponse::success(
            new AccCustomerTransactionResource($updated),
            'Totals updated successfully'
        );
    }

    public function update(
        UpdateAccCustomerTransactionRequest $request,
        AccCustomer $accCustomer,
        AccCustomerTransaction $transaction,
        UpdateAccCustomerTransactionAction $action
    ): JsonResponse {
        $this->authorize('update', $accCustomer);
        abort_unless($transaction->customer_id === $accCustomer->id, 404);

        $updated = $action->execute($accCustomer, $transaction, $request->toDTO());

        return ApiResponse::success(new AccCustomerTransactionResource($updated), 'Transaction updated successfully');
    }

    public function destroy(
        AccCustomer $accCustomer,
        AccCustomerTransaction $transaction,
        DeleteAccCustomerTransactionAction $action
    ): JsonResponse {
        $this->authorize('update', $accCustomer);
        abort_unless($transaction->customer_id === $accCustomer->id, 404);

        $action->execute($this->tenantId(), $accCustomer, $transaction);

        return ApiResponse::noContent('Transaction deleted successfully');
    }

    public function updateItem(
        StoreAccCustomerTransactionItemRequest $request,
        AccCustomer $accCustomer,
        AccCustomerTransaction $transaction,
        AccCustomerTransactionItem $item,
        UpdateAccCustomerTransactionItemAction $action
    ): JsonResponse {
        $this->authorize('update', $accCustomer);
        abort_unless($transaction->customer_id === $accCustomer->id, 404);
        abort_unless($item->transaction_id === $transaction->id, 404);

        $updated = $action->execute($this->tenantId(), $accCustomer, $transaction, $item, $request->toDTO());

        return ApiResponse::success(new AccCustomerTransactionItemResource($updated), 'Item updated successfully');
    }

    public function destroyItem(
        AccCustomer $accCustomer,
        AccCustomerTransaction $transaction,
        AccCustomerTransactionItem $item,
        DeleteAccCustomerTransactionItemAction $action
    ): JsonResponse {
        $this->authorize('update', $accCustomer);
        abort_unless($transaction->customer_id === $accCustomer->id, 404);
        abort_unless($item->transaction_id === $transaction->id, 404);

        $action->execute($this->tenantId(), $accCustomer, $transaction, $item);

        return ApiResponse::noContent('Item deleted successfully');
    }

    public function trashedItems(
        AccCustomer $accCustomer,
        AccCustomerTransaction $transaction,
        ListTrashedAccCustomerTransactionItemsAction $action
    ): JsonResponse {
        $this->authorize('view', $accCustomer);
        abort_unless($transaction->customer_id === $accCustomer->id, 404);

        return ApiResponse::success(
            AccCustomerTransactionItemResource::collection($action->execute($transaction)),
            'Trashed items retrieved successfully'
        );
    }

    public function restoreItem(
        AccCustomer $accCustomer,
        AccCustomerTransaction $transaction,
        string $itemUlid,
        RestoreAccCustomerTransactionItemAction $action
    ): JsonResponse {
        $this->authorize('update', $accCustomer);
        abort_unless($transaction->customer_id === $accCustomer->id, 404);

        $item = $action->execute($this->tenantId(), $accCustomer, $transaction, $itemUlid);

        return ApiResponse::success(new AccCustomerTransactionItemResource($item), 'Item restored successfully');
    }
}
