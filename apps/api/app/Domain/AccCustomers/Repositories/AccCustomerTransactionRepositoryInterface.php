<?php

namespace App\Domain\AccCustomers\Repositories;

use App\Domain\AccCustomers\DTOs\AccCustomerTransactionData;
use App\Domain\AccCustomers\DTOs\AccCustomerTransactionItemData;
use App\Domain\AccCustomers\DTOs\AccCustomerTransactionTotalsData;
use App\Models\AccCustomer;
use App\Models\AccCustomerTransaction;
use App\Models\AccCustomerTransactionItem;
use App\Models\Product;
use Illuminate\Pagination\LengthAwarePaginator;

interface AccCustomerTransactionRepositoryInterface
{
    public function paginate(AccCustomer $customer, int $perPage, ?int $fiscalYearId = null): LengthAwarePaginator;

    /**
     * All sales bills (transactions that have line items) across every customer in the
     * tenant, for the "Billing > Sales" screen's bill list.
     */
    public function paginateSalesBills(int $tenantId, int $perPage, ?int $fiscalYearId = null): LengthAwarePaginator;

    /** @return \Illuminate\Support\Collection<int, AccCustomerTransaction> */
    public function trashedSalesBills(int $tenantId, ?int $fiscalYearId = null): \Illuminate\Support\Collection;

    /** @return \Illuminate\Support\Collection<int, AccCustomerTransaction> */
    public function trashed(AccCustomer $customer, ?int $fiscalYearId = null): \Illuminate\Support\Collection;

    /**
     * Restore a soft-deleted transaction by ulid (implicit route-model-binding can't resolve
     * a trashed row, so this looks it up explicitly rather than taking a bound model).
     */
    public function restore(int $tenantId, AccCustomer $customer, string $transactionUlid): AccCustomerTransaction;

    /**
     * Net total (credit - debit) across a customer's transactions for a fiscal year.
     */
    public function netTotal(AccCustomer $customer, int $fiscalYearId): float;

    public function create(int $tenantId, AccCustomer $customer, int $fiscalYearId, AccCustomerTransactionData $data): AccCustomerTransaction;

    /**
     * Re-fetch the transaction locked for update, so a concurrent totals recalculation
     * (e.g. two items being added to the same bill at once) can't interleave its
     * read-then-write and drop one.
     */
    public function lockForRecalculation(AccCustomerTransaction $transaction): AccCustomerTransaction;

    public function updateTotals(AccCustomerTransaction $transaction, AccCustomerTransactionTotalsData $totals): AccCustomerTransaction;

    /** Sum of each line item's `total` (post per-row discount) for the transaction. */
    public function itemsTotal(AccCustomerTransaction $transaction): int;

    public function createItem(int $tenantId, AccCustomer $customer, AccCustomerTransaction $transaction, Product $product, AccCustomerTransactionItemData $item): AccCustomerTransactionItem;

    /** Header fields only (date/particular/voucher/cheque/debit/credit) — never touches items. */
    public function update(AccCustomerTransaction $transaction, AccCustomerTransactionData $data): AccCustomerTransaction;

    public function delete(AccCustomerTransaction $transaction): void;

    public function hasItems(AccCustomerTransaction $transaction): bool;

    /** @return \Illuminate\Support\Collection<int, AccCustomerTransactionItem> */
    public function items(AccCustomerTransaction $transaction): \Illuminate\Support\Collection;

    public function itemsCount(AccCustomerTransaction $transaction): int;

    public function lockItemForUpdate(AccCustomerTransactionItem $item): AccCustomerTransactionItem;

    public function updateItem(AccCustomerTransactionItem $item, Product $product, AccCustomerTransactionItemData $data): AccCustomerTransactionItem;

    public function deleteItem(AccCustomerTransactionItem $item): void;

    /** @return \Illuminate\Support\Collection<int, AccCustomerTransactionItem> */
    public function trashedItems(AccCustomerTransaction $transaction): \Illuminate\Support\Collection;

    /**
     * Restore a soft-deleted item by ulid (implicit route-model-binding can't resolve a
     * trashed row, so this looks it up explicitly rather than taking a bound model).
     */
    public function restoreItem(int $tenantId, AccCustomerTransaction $transaction, string $itemUlid): AccCustomerTransactionItem;
}
