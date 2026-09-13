<?php

namespace App\Domain\AccVendors\Repositories;

use App\Domain\AccVendors\DTOs\AccVendorTransactionData;
use App\Domain\AccVendors\DTOs\AccVendorTransactionItemData;
use App\Domain\AccVendors\DTOs\AccVendorTransactionTotalsData;
use App\Models\AccVendor;
use App\Models\AccVendorTransaction;
use App\Models\AccVendorTransactionItem;
use App\Models\Product;
use Illuminate\Pagination\LengthAwarePaginator;

interface AccVendorTransactionRepositoryInterface
{
    public function paginate(AccVendor $vendor, int $perPage): LengthAwarePaginator;

    /**
     * Net total (credit - debit) across a vendor's transactions for a fiscal year.
     */
    public function netTotal(AccVendor $vendor, int $fiscalYearId): float;

    public function create(int $tenantId, AccVendor $vendor, int $fiscalYearId, AccVendorTransactionData $data): AccVendorTransaction;

    /**
     * Re-fetch the transaction locked for update, so a concurrent totals recalculation
     * (e.g. two items being added to the same bill at once) can't interleave its
     * read-then-write and drop one.
     */
    public function lockForRecalculation(AccVendorTransaction $transaction): AccVendorTransaction;

    public function updateTotals(AccVendorTransaction $transaction, AccVendorTransactionTotalsData $totals): AccVendorTransaction;

    /** Sum of each line item's `total` (post per-row discount) for the transaction. */
    public function itemsTotal(AccVendorTransaction $transaction): int;

    public function createItem(int $tenantId, AccVendor $vendor, AccVendorTransaction $transaction, Product $product, AccVendorTransactionItemData $item): AccVendorTransactionItem;

    /** Header fields only (date/particular/voucher/cheque/debit/credit) — never touches items. */
    public function update(AccVendorTransaction $transaction, AccVendorTransactionData $data): AccVendorTransaction;

    public function delete(AccVendorTransaction $transaction): void;

    public function hasItems(AccVendorTransaction $transaction): bool;

    /** @return \Illuminate\Support\Collection<int, AccVendorTransactionItem> */
    public function items(AccVendorTransaction $transaction): \Illuminate\Support\Collection;

    public function itemsCount(AccVendorTransaction $transaction): int;

    public function lockItemForUpdate(AccVendorTransactionItem $item): AccVendorTransactionItem;

    public function updateItem(AccVendorTransactionItem $item, Product $product, AccVendorTransactionItemData $data): AccVendorTransactionItem;

    public function deleteItem(AccVendorTransactionItem $item): void;
}
