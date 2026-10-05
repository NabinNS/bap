<?php

namespace App\Infrastructure\Repositories\AccQuotations;

use App\Domain\AccQuotations\DTOs\AccQuotationData;
use App\Domain\AccQuotations\DTOs\AccQuotationItemData;
use App\Domain\AccQuotations\DTOs\AccQuotationTotalsData;
use App\Domain\AccQuotations\Repositories\AccQuotationRepositoryInterface;
use App\Models\AccCustomer;
use App\Models\AccQuotation;
use App\Models\AccQuotationItem;
use App\Models\Product;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

class EloquentAccQuotationRepository implements AccQuotationRepositoryInterface
{
    public function paginate(AccCustomer $customer, int $perPage, ?int $fiscalYearId = null): LengthAwarePaginator
    {
        return AccQuotation::where('customer_id', $customer->id)
            ->where('tenant_id', $customer->tenant_id)
            ->when($fiscalYearId, fn ($query) => $query->where('fiscal_year_id', $fiscalYearId))
            ->with(['items.product'])
            ->orderBy('date', 'asc')
            ->paginate($perPage);
    }

    public function paginateAll(int $tenantId, int $perPage, ?int $fiscalYearId = null): LengthAwarePaginator
    {
        return AccQuotation::where('tenant_id', $tenantId)
            ->when($fiscalYearId, fn ($query) => $query->where('fiscal_year_id', $fiscalYearId))
            ->with(['customer', 'items.product'])
            ->orderBy('date', 'desc')
            ->paginate($perPage);
    }

    public function trashedAll(int $tenantId, ?int $fiscalYearId = null): Collection
    {
        return AccQuotation::onlyTrashed()
            ->where('tenant_id', $tenantId)
            ->when($fiscalYearId, fn ($query) => $query->where('fiscal_year_id', $fiscalYearId))
            ->with(['customer', 'items.product'])
            ->orderBy('deleted_at', 'desc')
            ->get();
    }

    public function trashed(AccCustomer $customer, ?int $fiscalYearId = null): Collection
    {
        return AccQuotation::onlyTrashed()
            ->where('customer_id', $customer->id)
            ->where('tenant_id', $customer->tenant_id)
            ->when($fiscalYearId, fn ($query) => $query->where('fiscal_year_id', $fiscalYearId))
            ->with(['items.product'])
            ->orderBy('deleted_at', 'desc')
            ->get();
    }

    public function restore(int $tenantId, string $quotationUlid): AccQuotation
    {
        $quotation = AccQuotation::onlyTrashed()
            ->where('ulid', $quotationUlid)
            ->where('tenant_id', $tenantId)
            ->firstOrFail();

        $quotation->restore();

        return $quotation->fresh();
    }

    public function create(int $tenantId, AccCustomer $customer, int $fiscalYearId, AccQuotationData $data): AccQuotation
    {
        return $customer->quotations()->create([
            'tenant_id'      => $tenantId,
            'fiscal_year_id' => $fiscalYearId,
            'date'           => $data->date,
            'voucher_no'     => $data->voucherNo,
            'bill_details'   => $data->discountPercent !== null
                ? ['discount_percent' => $data->discountPercent]
                : null,
        ]);
    }

    public function lockForRecalculation(AccQuotation $quotation): AccQuotation
    {
        return AccQuotation::lockForUpdate()->findOrFail($quotation->id);
    }

    public function updateTotals(AccQuotation $quotation, AccQuotationTotalsData $totals): AccQuotation
    {
        $quotation->update([
            'bill_details' => [
                'discount_percent' => $totals->discountPercent,
                'discount_amount'  => $totals->discountAmount,
                'taxable_amount'   => $totals->taxableAmount,
                'vat_amount'       => $totals->vatAmount,
                'grand_total'      => $totals->grandTotal,
            ],
        ]);

        return $quotation->fresh();
    }

    public function itemsTotal(AccQuotation $quotation): int
    {
        return (int) $quotation->items()->sum('total');
    }

    public function createItem(int $tenantId, AccQuotation $quotation, Product $product, AccQuotationItemData $item): AccQuotationItem
    {
        $amount = $item->quantity * $item->rate;
        $total  = max(0, $amount - $item->discount);

        return $quotation->items()->create([
            'tenant_id'  => $tenantId,
            'product_id' => $product->id,
            'quantity'   => $item->quantity,
            'rate'       => $item->rate,
            'amount'     => $amount,
            'discount'   => $item->discount,
            'total'      => $total,
        ]);
    }

    public function update(AccQuotation $quotation, AccQuotationData $data): AccQuotation
    {
        $quotation->update([
            'date'       => $data->date,
            'voucher_no' => $data->voucherNo,
        ]);

        return $quotation->fresh();
    }

    public function delete(AccQuotation $quotation): void
    {
        $quotation->delete();
    }

    public function items(AccQuotation $quotation): Collection
    {
        return $quotation->items()->get();
    }

    public function itemsCount(AccQuotation $quotation): int
    {
        return $quotation->items()->count();
    }

    public function lockItemForUpdate(AccQuotationItem $item): AccQuotationItem
    {
        return AccQuotationItem::lockForUpdate()->findOrFail($item->id);
    }

    public function updateItem(AccQuotationItem $item, Product $product, AccQuotationItemData $data): AccQuotationItem
    {
        $amount = $data->quantity * $data->rate;
        $total  = max(0, $amount - $data->discount);

        $item->update([
            'product_id' => $product->id,
            'quantity'   => $data->quantity,
            'rate'       => $data->rate,
            'amount'     => $amount,
            'discount'   => $data->discount,
            'total'      => $total,
        ]);

        return $item->fresh();
    }

    public function deleteItem(AccQuotationItem $item): void
    {
        $item->delete();
    }

    public function trashedItems(AccQuotation $quotation): Collection
    {
        return AccQuotationItem::onlyTrashed()
            ->where('quotation_id', $quotation->id)
            ->with(['product', 'quotation'])
            ->orderBy('deleted_at', 'desc')
            ->get();
    }

    public function restoreItem(int $tenantId, AccQuotation $quotation, string $itemUlid): AccQuotationItem
    {
        $item = AccQuotationItem::onlyTrashed()
            ->where('ulid', $itemUlid)
            ->where('quotation_id', $quotation->id)
            ->where('tenant_id', $tenantId)
            ->firstOrFail();

        $item->restore();

        return $item->fresh();
    }
}
