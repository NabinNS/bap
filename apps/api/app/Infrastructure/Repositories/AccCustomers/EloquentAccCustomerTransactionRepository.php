<?php

namespace App\Infrastructure\Repositories\AccCustomers;

use App\Domain\AccCustomers\DTOs\AccCustomerTransactionData;
use App\Domain\AccCustomers\DTOs\AccCustomerTransactionItemData;
use App\Domain\AccCustomers\DTOs\AccCustomerTransactionTotalsData;
use App\Domain\AccCustomers\Repositories\AccCustomerTransactionRepositoryInterface;
use App\Models\AccCustomer;
use App\Models\AccCustomerTransaction;
use App\Models\AccCustomerTransactionItem;
use App\Models\Product;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

class EloquentAccCustomerTransactionRepository implements AccCustomerTransactionRepositoryInterface
{
    public function paginate(AccCustomer $customer, int $perPage, ?int $fiscalYearId = null): LengthAwarePaginator
    {
        return AccCustomerTransaction::where('customer_id', $customer->id)
            ->where('tenant_id', $customer->tenant_id)
            ->when($fiscalYearId, fn ($query) => $query->where('fiscal_year_id', $fiscalYearId))
            ->with(['items.product'])
            ->orderBy('date', 'asc')
            ->paginate($perPage);
    }

    public function trashed(AccCustomer $customer, ?int $fiscalYearId = null): Collection
    {
        return AccCustomerTransaction::onlyTrashed()
            ->where('customer_id', $customer->id)
            ->where('tenant_id', $customer->tenant_id)
            ->when($fiscalYearId, fn ($query) => $query->where('fiscal_year_id', $fiscalYearId))
            ->with(['items.product'])
            ->orderBy('deleted_at', 'desc')
            ->get();
    }

    public function restore(int $tenantId, AccCustomer $customer, string $transactionUlid): AccCustomerTransaction
    {
        $transaction = AccCustomerTransaction::onlyTrashed()
            ->where('ulid', $transactionUlid)
            ->where('customer_id', $customer->id)
            ->where('tenant_id', $tenantId)
            ->firstOrFail();

        $transaction->restore();

        return $transaction->fresh();
    }

    public function netTotal(AccCustomer $customer, int $fiscalYearId): float
    {
        return (float) $customer->transactions()
            ->where('tenant_id', $customer->tenant_id)
            ->where('fiscal_year_id', $fiscalYearId)
            ->selectRaw('COALESCE(SUM(credit), 0) - COALESCE(SUM(debit), 0) as net')
            ->value('net');
    }

    public function create(int $tenantId, AccCustomer $customer, int $fiscalYearId, AccCustomerTransactionData $data): AccCustomerTransaction
    {
        $hasItems = (bool) $data->items;

        return $customer->transactions()->create([
            'tenant_id'      => $tenantId,
            'fiscal_year_id' => $fiscalYearId,
            'date'           => $data->date,
            'particular'     => $data->particular,
            'voucher_no'     => $data->voucherNo,
            'cheque_no'      => $data->chequeNo,
            'debit'          => $data->debit,
            // When items are supplied, credit is derived from their amounts (via the totals
            // recalculation that runs as each item is recorded) since a sale increases what the
            // customer owes; otherwise use the manually entered debit/credit — a plain ledger
            // entry, e.g. a payment received.
            'credit'         => $hasItems ? 0 : $data->credit,
            'bill_details'   => $data->discountPercent !== null
                ? ['discount_percent' => $data->discountPercent]
                : null,
        ]);
    }

    public function lockForRecalculation(AccCustomerTransaction $transaction): AccCustomerTransaction
    {
        return AccCustomerTransaction::lockForUpdate()->findOrFail($transaction->id);
    }

    public function updateTotals(AccCustomerTransaction $transaction, AccCustomerTransactionTotalsData $totals): AccCustomerTransaction
    {
        $transaction->update([
            'bill_details' => [
                'discount_percent' => $totals->discountPercent,
                'discount_amount'  => $totals->discountAmount,
                'taxable_amount'   => $totals->taxableAmount,
                'vat_amount'       => $totals->vatAmount,
                'grand_total'      => $totals->grandTotal,
            ],
            // Kept in sync with grand_total so the customer's ledger balance reflects the real amount owed.
            'credit' => $totals->grandTotal,
        ]);

        return $transaction->fresh();
    }

    public function itemsTotal(AccCustomerTransaction $transaction): int
    {
        return (int) $transaction->items()->sum('total');
    }

    public function createItem(int $tenantId, AccCustomer $customer, AccCustomerTransaction $transaction, Product $product, AccCustomerTransactionItemData $item): AccCustomerTransactionItem
    {
        $amount = $item->quantity * $item->rate;
        $total  = max(0, $amount - $item->discount);

        return $transaction->items()->create([
            'tenant_id'   => $tenantId,
            'customer_id' => $customer->id,
            'product_id'  => $product->id,
            'quantity'    => $item->quantity,
            'rate'        => $item->rate,
            'amount'      => $amount,
            'discount'    => $item->discount,
            'total'       => $total,
        ]);
    }

    public function update(AccCustomerTransaction $transaction, AccCustomerTransactionData $data): AccCustomerTransaction
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

    public function delete(AccCustomerTransaction $transaction): void
    {
        $transaction->delete();
    }

    public function hasItems(AccCustomerTransaction $transaction): bool
    {
        return $transaction->items()->exists();
    }

    public function items(AccCustomerTransaction $transaction): Collection
    {
        return $transaction->items()->get();
    }

    public function itemsCount(AccCustomerTransaction $transaction): int
    {
        return $transaction->items()->count();
    }

    public function lockItemForUpdate(AccCustomerTransactionItem $item): AccCustomerTransactionItem
    {
        return AccCustomerTransactionItem::lockForUpdate()->findOrFail($item->id);
    }

    public function updateItem(AccCustomerTransactionItem $item, Product $product, AccCustomerTransactionItemData $data): AccCustomerTransactionItem
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

    public function deleteItem(AccCustomerTransactionItem $item): void
    {
        $item->delete();
    }

    public function trashedItems(AccCustomerTransaction $transaction): Collection
    {
        return AccCustomerTransactionItem::onlyTrashed()
            ->where('transaction_id', $transaction->id)
            ->with(['product', 'transaction'])
            ->orderBy('deleted_at', 'desc')
            ->get();
    }

    public function restoreItem(int $tenantId, AccCustomerTransaction $transaction, string $itemUlid): AccCustomerTransactionItem
    {
        $item = AccCustomerTransactionItem::onlyTrashed()
            ->where('ulid', $itemUlid)
            ->where('transaction_id', $transaction->id)
            ->where('tenant_id', $tenantId)
            ->firstOrFail();

        $item->restore();

        return $item->fresh();
    }
}
