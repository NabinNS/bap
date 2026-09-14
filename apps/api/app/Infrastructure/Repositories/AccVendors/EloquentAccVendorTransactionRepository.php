<?php

namespace App\Infrastructure\Repositories\AccVendors;

use App\Domain\AccVendors\DTOs\AccVendorTransactionData;
use App\Domain\AccVendors\DTOs\AccVendorTransactionItemData;
use App\Domain\AccVendors\DTOs\AccVendorTransactionTotalsData;
use App\Domain\AccVendors\Repositories\AccVendorTransactionRepositoryInterface;
use App\Models\AccVendor;
use App\Models\AccVendorTransaction;
use App\Models\AccVendorTransactionItem;
use App\Models\Product;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

class EloquentAccVendorTransactionRepository implements AccVendorTransactionRepositoryInterface
{
    public function paginate(AccVendor $vendor, int $perPage, ?int $fiscalYearId = null): LengthAwarePaginator
    {
        return AccVendorTransaction::where('vendor_id', $vendor->id)
            ->when($fiscalYearId, fn ($query) => $query->where('fiscal_year_id', $fiscalYearId))
            ->with(['items.product'])
            ->orderBy('date', 'asc')
            ->paginate($perPage);
    }

    public function trashed(AccVendor $vendor): Collection
    {
        return AccVendorTransaction::onlyTrashed()
            ->where('vendor_id', $vendor->id)
            ->with(['items.product'])
            ->orderBy('deleted_at', 'desc')
            ->get();
    }

    public function restore(int $tenantId, AccVendor $vendor, string $transactionUlid): AccVendorTransaction
    {
        $transaction = AccVendorTransaction::onlyTrashed()
            ->where('ulid', $transactionUlid)
            ->where('vendor_id', $vendor->id)
            ->where('tenant_id', $tenantId)
            ->firstOrFail();

        $transaction->restore();

        return $transaction->fresh();
    }

    public function netTotal(AccVendor $vendor, int $fiscalYearId): float
    {
        return (float) $vendor->transactions()
            ->where('fiscal_year_id', $fiscalYearId)
            ->selectRaw('COALESCE(SUM(credit), 0) - COALESCE(SUM(debit), 0) as net')
            ->value('net');
    }

    public function create(int $tenantId, AccVendor $vendor, int $fiscalYearId, AccVendorTransactionData $data): AccVendorTransaction
    {
        $hasItems = (bool) $data->items;

        return $vendor->transactions()->create([
            'tenant_id'      => $tenantId,
            'fiscal_year_id' => $fiscalYearId,
            'date'           => $data->date,
            'particular'     => $data->particular,
            'voucher_no'     => $data->voucherNo,
            'cheque_no'      => $data->chequeNo,
            'debit'          => $data->debit,
            // When items are supplied, credit is derived from their amounts (via the totals
            // recalculation that runs as each item is recorded) since a purchase increases what's
            // owed to the vendor; otherwise use the manually entered debit/credit — a plain ledger
            // entry, e.g. a payment.
            'credit'         => $hasItems ? 0 : $data->credit,
            'bill_details'   => $data->discountPercent !== null
                ? ['discount_percent' => $data->discountPercent]
                : null,
        ]);
    }

    public function lockForRecalculation(AccVendorTransaction $transaction): AccVendorTransaction
    {
        return AccVendorTransaction::lockForUpdate()->findOrFail($transaction->id);
    }

    public function updateTotals(AccVendorTransaction $transaction, AccVendorTransactionTotalsData $totals): AccVendorTransaction
    {
        $transaction->update([
            'bill_details' => [
                'discount_percent' => $totals->discountPercent,
                'discount_amount'  => $totals->discountAmount,
                'taxable_amount'   => $totals->taxableAmount,
                'vat_amount'       => $totals->vatAmount,
                'grand_total'      => $totals->grandTotal,
            ],
            // Kept in sync with grand_total so the vendor's ledger balance reflects the real amount owed.
            'credit' => $totals->grandTotal,
        ]);

        return $transaction->fresh();
    }

    public function itemsTotal(AccVendorTransaction $transaction): int
    {
        return (int) $transaction->items()->sum('total');
    }

    public function createItem(int $tenantId, AccVendor $vendor, AccVendorTransaction $transaction, Product $product, AccVendorTransactionItemData $item): AccVendorTransactionItem
    {
        $amount = $item->quantity * $item->rate;
        $total  = max(0, $amount - $item->discount);

        return $transaction->items()->create([
            'tenant_id'  => $tenantId,
            'vendor_id'  => $vendor->id,
            'product_id' => $product->id,
            'quantity'   => $item->quantity,
            'rate'       => $item->rate,
            'amount'     => $amount,
            'discount'   => $item->discount,
            'total'      => $total,
        ]);
    }

    public function update(AccVendorTransaction $transaction, AccVendorTransactionData $data): AccVendorTransaction
    {
        $transaction->update([
            'date'       => $data->date,
            'particular' => $data->particular,
            'voucher_no' => $data->voucherNo,
            'cheque_no'  => $data->chequeNo,
            'debit'      => $data->debit,
            'credit'     => $data->credit,
        ]);

        return $transaction->fresh();
    }

    public function delete(AccVendorTransaction $transaction): void
    {
        $transaction->delete();
    }

    public function hasItems(AccVendorTransaction $transaction): bool
    {
        return $transaction->items()->exists();
    }

    public function items(AccVendorTransaction $transaction): Collection
    {
        return $transaction->items()->get();
    }

    public function itemsCount(AccVendorTransaction $transaction): int
    {
        return $transaction->items()->count();
    }

    public function lockItemForUpdate(AccVendorTransactionItem $item): AccVendorTransactionItem
    {
        return AccVendorTransactionItem::lockForUpdate()->findOrFail($item->id);
    }

    public function updateItem(AccVendorTransactionItem $item, Product $product, AccVendorTransactionItemData $data): AccVendorTransactionItem
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

    public function deleteItem(AccVendorTransactionItem $item): void
    {
        $item->delete();
    }
}
