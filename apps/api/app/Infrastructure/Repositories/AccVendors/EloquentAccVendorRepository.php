<?php

namespace App\Infrastructure\Repositories\AccVendors;

use App\Domain\AccVendors\DTOs\AccVendorData;
use App\Domain\AccVendors\DTOs\AccVendorFilterData;
use App\Domain\AccVendors\Repositories\AccVendorRepositoryInterface;
use App\Models\AccVendor;
use App\Models\AccVendorTransactionItem;
use App\Models\Product;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

class EloquentAccVendorRepository implements AccVendorRepositoryInterface
{
    public function paginate(int $tenantId, int $perPage, AccVendorFilterData $filters): LengthAwarePaginator
    {
        return AccVendor::where('tenant_id', $tenantId)
            ->with('balances')
            ->when($filters->search, fn($q, $v) => $q->where('name', 'like', "%$v%"))
            ->orderBy($filters->sortBy, $filters->sortDir)
            ->paginate($perPage);
    }

    public function findByIds(int $tenantId, array $ids): Collection
    {
        return AccVendor::where('tenant_id', $tenantId)
            ->whereIn('id', $ids)
            ->get();
    }

    public function create(int $tenantId, AccVendorData $data): AccVendor
    {
        return AccVendor::create([
            'tenant_id' => $tenantId,
            'name'      => $data->name,
            'address'   => $data->address,
            'phone'     => $data->phone,
            'telephone' => $data->telephone,
            'vat_no'    => $data->vatNo,
        ]);
    }

    public function update(AccVendor $vendor, AccVendorData $data): AccVendor
    {
        $vendor->update([
            'name'      => $data->name,
            'address'   => $data->address,
            'phone'     => $data->phone,
            'telephone' => $data->telephone,
            'vat_no'    => $data->vatNo,
        ]);

        return $vendor->fresh();
    }

    public function delete(AccVendor $vendor): void
    {
        $vendor->delete();
    }

    public function trashed(int $tenantId): Collection
    {
        return AccVendor::onlyTrashed()
            ->where('tenant_id', $tenantId)
            ->orderBy('deleted_at', 'desc')
            ->get();
    }

    public function restore(int $tenantId, string $vendorUlid): AccVendor
    {
        $vendor = AccVendor::onlyTrashed()
            ->where('ulid', $vendorUlid)
            ->where('tenant_id', $tenantId)
            ->firstOrFail();

        $vendor->restore();

        return $vendor->fresh();
    }

    public function findLowStockProductsPreviouslyPurchased(int $tenantId, AccVendor $vendor): Collection
    {
        $productIds = $vendor->transactionItems()
            ->where('tenant_id', $tenantId)
            ->distinct()
            ->pluck('product_id');

        return Product::where('tenant_id', $tenantId)
            ->whereIn('id', $productIds)
            ->whereNotNull('low_stock_quantity')
            ->whereColumn('stock', '<=', 'low_stock_quantity')
            ->get();
    }

    public function findLatestRatesForProducts(int $tenantId, AccVendor $vendor, array $productUlids): Collection
    {
        if (empty($productUlids)) {
            return collect();
        }

        return AccVendorTransactionItem::query()
            ->join('acc_vendor_transactions', 'acc_vendor_transactions.id', '=', 'acc_vendor_transaction_items.transaction_id')
            ->join('products', 'products.id', '=', 'acc_vendor_transaction_items.product_id')
            ->where('acc_vendor_transaction_items.tenant_id', $tenantId)
            ->where('acc_vendor_transaction_items.vendor_id', $vendor->id)
            ->whereIn('products.ulid', $productUlids)
            ->selectRaw('DISTINCT ON (acc_vendor_transaction_items.product_id) products.ulid as product_ulid, acc_vendor_transaction_items.rate')
            ->orderBy('acc_vendor_transaction_items.product_id')
            ->orderByDesc('acc_vendor_transactions.date')
            ->orderByDesc('acc_vendor_transaction_items.id')
            ->get()
            ->map(fn($row) => ['product_ulid' => $row->product_ulid, 'rate' => (int) $row->rate]);
    }
}
