<?php

namespace App\Domain\AccQuotations\Repositories;

use App\Domain\AccQuotations\DTOs\AccQuotationData;
use App\Domain\AccQuotations\DTOs\AccQuotationItemData;
use App\Domain\AccQuotations\DTOs\AccQuotationTotalsData;
use App\Models\AccCustomer;
use App\Models\AccQuotation;
use App\Models\AccQuotationItem;
use App\Models\Product;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

interface AccQuotationRepositoryInterface
{
    public function paginate(AccCustomer $customer, int $perPage, ?int $fiscalYearId = null): LengthAwarePaginator;

    /**
     * All quotations across every customer in the tenant, for the "Billing > Quotation/Estimate"
     * screen's list.
     */
    public function paginateAll(int $tenantId, int $perPage, ?int $fiscalYearId = null): LengthAwarePaginator;

    /** @return Collection<int, AccQuotation> */
    public function trashedAll(int $tenantId, ?int $fiscalYearId = null): Collection;

    /** @return Collection<int, AccQuotation> */
    public function trashed(AccCustomer $customer, ?int $fiscalYearId = null): Collection;

    /**
     * Restore a soft-deleted quotation by ulid (implicit route-model-binding can't resolve
     * a trashed row, so this looks it up explicitly rather than taking a bound model).
     */
    public function restore(int $tenantId, string $quotationUlid): AccQuotation;

    public function create(int $tenantId, AccCustomer $customer, int $fiscalYearId, AccQuotationData $data): AccQuotation;

    /**
     * Re-fetch the quotation locked for update, so a concurrent totals recalculation (e.g. two
     * items being added to the same quote at once) can't interleave its read-then-write and
     * drop one.
     */
    public function lockForRecalculation(AccQuotation $quotation): AccQuotation;

    public function updateTotals(AccQuotation $quotation, AccQuotationTotalsData $totals): AccQuotation;

    /** Sum of each line item's `total` (post per-row discount) for the quotation. */
    public function itemsTotal(AccQuotation $quotation): int;

    public function createItem(int $tenantId, AccQuotation $quotation, Product $product, AccQuotationItemData $item): AccQuotationItem;

    /** Header fields only (date/voucher_no) — never touches items. */
    public function update(AccQuotation $quotation, AccQuotationData $data): AccQuotation;

    public function delete(AccQuotation $quotation): void;

    /** @return Collection<int, AccQuotationItem> */
    public function items(AccQuotation $quotation): Collection;

    public function itemsCount(AccQuotation $quotation): int;

    public function lockItemForUpdate(AccQuotationItem $item): AccQuotationItem;

    public function updateItem(AccQuotationItem $item, Product $product, AccQuotationItemData $data): AccQuotationItem;

    public function deleteItem(AccQuotationItem $item): void;

    /** @return Collection<int, AccQuotationItem> */
    public function trashedItems(AccQuotation $quotation): Collection;

    /**
     * Restore a soft-deleted item by ulid (implicit route-model-binding can't resolve a
     * trashed row, so this looks it up explicitly rather than taking a bound model).
     */
    public function restoreItem(int $tenantId, AccQuotation $quotation, string $itemUlid): AccQuotationItem;
}
