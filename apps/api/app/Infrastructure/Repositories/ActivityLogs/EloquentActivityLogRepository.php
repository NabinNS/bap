<?php

namespace App\Infrastructure\Repositories\ActivityLogs;

use App\Domain\ActivityLogs\Repositories\ActivityLogRepositoryInterface;
use App\Models\AccCustomer;
use App\Models\AccCustomerTransaction;
use App\Models\AccCustomerTransactionItem;
use App\Models\AccQuotation;
use App\Models\AccQuotationItem;
use App\Models\AccVendor;
use App\Models\AccVendorTransaction;
use App\Models\AccVendorTransactionItem;
use App\Models\ActivityLog;
use App\Models\Product;
use App\Models\ProductTransactionItem;
use Illuminate\Pagination\LengthAwarePaginator;

class EloquentActivityLogRepository implements ActivityLogRepositoryInterface
{
    /** Every morph-mapped subject type the resource actually reads (only `ulid`) — passed to
     *  MorphTo::constrain() so hydrating `subject` across a mixed-type page (e.g. a vendor's
     *  aggregated feed spanning acc_vendor/_transaction/_transaction_item) selects just that
     *  column per type instead of the full row. */
    private const SUBJECT_COLUMNS = [
        AccCustomer::class => ['id', 'ulid'],
        AccCustomerTransaction::class => ['id', 'ulid'],
        AccCustomerTransactionItem::class => ['id', 'ulid'],
        AccQuotation::class => ['id', 'ulid'],
        AccQuotationItem::class => ['id', 'ulid'],
        AccVendor::class => ['id', 'ulid'],
        AccVendorTransaction::class => ['id', 'ulid'],
        AccVendorTransactionItem::class => ['id', 'ulid'],
        Product::class => ['id', 'ulid'],
        ProductTransactionItem::class => ['id', 'ulid'],
    ];

    public function resolveSubjectId(string $subjectType, string $subjectUlid, int $tenantId): int
    {
        return match ($subjectType) {
            'acc_customer_transaction' => AccCustomerTransaction::where('ulid', $subjectUlid)->where('tenant_id', $tenantId)->firstOrFail()->id,
            'acc_vendor_transaction'   => AccVendorTransaction::where('ulid', $subjectUlid)->where('tenant_id', $tenantId)->firstOrFail()->id,
            'acc_quotation'            => AccQuotation::where('ulid', $subjectUlid)->where('tenant_id', $tenantId)->firstOrFail()->id,
            'product_transaction_item' => ProductTransactionItem::where('ulid', $subjectUlid)->where('tenant_id', $tenantId)->firstOrFail()->id,
            'product'                  => Product::where('ulid', $subjectUlid)->where('tenant_id', $tenantId)->firstOrFail()->id,
            'acc_customer'             => AccCustomer::where('ulid', $subjectUlid)->where('tenant_id', $tenantId)->firstOrFail()->id,
            'acc_vendor'               => AccVendor::where('ulid', $subjectUlid)->where('tenant_id', $tenantId)->firstOrFail()->id,
            'acc_vendor_transaction_item'   => AccVendorTransactionItem::where('ulid', $subjectUlid)->where('tenant_id', $tenantId)->firstOrFail()->id,
            'acc_customer_transaction_item' => AccCustomerTransactionItem::where('ulid', $subjectUlid)->where('tenant_id', $tenantId)->firstOrFail()->id,
            'acc_quotation_item'            => AccQuotationItem::where('ulid', $subjectUlid)->where('tenant_id', $tenantId)->firstOrFail()->id,
            default                    => abort(422, 'Unsupported activity log subject type.'),
        };
    }

    /** A bill/quotation header's item type, and the column on that item linking it back to the
     *  header — used so a transaction/quotation-scoped activity feed (not the wider
     *  vendor/customer-aggregated one) can still pull in its own line items' log rows, which
     *  otherwise have a different `subject_type` and would never match a plain subject_type +
     *  subject_id filter. */
    private const ITEM_TYPE_FOR_PARENT = [
        'acc_vendor_transaction'   => ['acc_vendor_transaction_item', AccVendorTransactionItem::class, 'transaction_id'],
        'acc_customer_transaction' => ['acc_customer_transaction_item', AccCustomerTransactionItem::class, 'transaction_id'],
        'acc_quotation'            => ['acc_quotation_item', AccQuotationItem::class, 'quotation_id'],
    ];

    public function listForSubject(string $subjectType, int $subjectId, int $tenantId): LengthAwarePaginator
    {
        $withSubject = fn ($query) => $query->with(['subject' => fn ($morphTo) => $morphTo->constrain(array_map(
            fn (array $columns) => fn ($q) => $q->select($columns),
            self::SUBJECT_COLUMNS
        ))]);

        return match (true) {
            // A vendor/customer/product's own log rows plus everything written against it
            // (its transactions, its transactions' line items) share one `owner_type` +
            // `owner_id` set at write time — so the aggregated feed is a single indexed
            // lookup instead of first collecting every one of its transaction/item ids.
            in_array($subjectType, ['acc_vendor', 'acc_customer', 'product'], true) => $withSubject(
                ActivityLog::with(['user:id,name'])
            )
                ->where('tenant_id', $tenantId)
                ->where('owner_type', $subjectType)
                ->where('owner_id', $subjectId)
                ->latest()
                ->paginate(25),

            // A bill/quotation header's own feed: its own rows, plus its line items' rows (a
            // different subject_type, scoped via the items' FK back to this header) so the
            // panel can still group/show "Item X — qty..." underneath the header entry.
            isset(self::ITEM_TYPE_FOR_PARENT[$subjectType]) => (function () use ($withSubject, $subjectType, $subjectId, $tenantId) {
                [$itemType, $itemClass, $fk] = self::ITEM_TYPE_FOR_PARENT[$subjectType];
                $itemIds = $itemClass::where($fk, $subjectId)->where('tenant_id', $tenantId)->pluck('id');

                return $withSubject(ActivityLog::with(['user:id,name']))
                    ->where('tenant_id', $tenantId)
                    ->where(function ($query) use ($subjectType, $subjectId, $itemType, $itemIds) {
                        $query->where(fn ($q) => $q->where('subject_type', $subjectType)->where('subject_id', $subjectId))
                            ->orWhere(fn ($q) => $q->where('subject_type', $itemType)->whereIn('subject_id', $itemIds));
                    })
                    ->latest()
                    ->paginate(25);
            })(),

            default => $withSubject(ActivityLog::with(['user:id,name']))
                ->where('tenant_id', $tenantId)
                ->where('subject_type', $subjectType)
                ->where('subject_id', $subjectId)
                ->latest()
                ->paginate(25),
        };
    }
}
