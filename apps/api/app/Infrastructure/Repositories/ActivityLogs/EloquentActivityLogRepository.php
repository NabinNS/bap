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
use App\Models\ProductTransactionItem;
use Illuminate\Pagination\LengthAwarePaginator;

class EloquentActivityLogRepository implements ActivityLogRepositoryInterface
{
    public function resolveSubjectId(string $subjectType, string $subjectUlid, int $tenantId): int
    {
        return match ($subjectType) {
            'acc_customer_transaction' => AccCustomerTransaction::where('ulid', $subjectUlid)->where('tenant_id', $tenantId)->firstOrFail()->id,
            'acc_vendor_transaction'   => AccVendorTransaction::where('ulid', $subjectUlid)->where('tenant_id', $tenantId)->firstOrFail()->id,
            'acc_quotation'            => AccQuotation::where('ulid', $subjectUlid)->where('tenant_id', $tenantId)->firstOrFail()->id,
            'product_transaction_item' => ProductTransactionItem::where('ulid', $subjectUlid)->where('tenant_id', $tenantId)->firstOrFail()->id,
            'acc_customer'             => AccCustomer::where('ulid', $subjectUlid)->where('tenant_id', $tenantId)->firstOrFail()->id,
            'acc_vendor'               => AccVendor::where('ulid', $subjectUlid)->where('tenant_id', $tenantId)->firstOrFail()->id,
            'acc_vendor_transaction_item'   => AccVendorTransactionItem::where('ulid', $subjectUlid)->where('tenant_id', $tenantId)->firstOrFail()->id,
            'acc_customer_transaction_item' => AccCustomerTransactionItem::where('ulid', $subjectUlid)->where('tenant_id', $tenantId)->firstOrFail()->id,
            'acc_quotation_item'            => AccQuotationItem::where('ulid', $subjectUlid)->where('tenant_id', $tenantId)->firstOrFail()->id,
            default                    => abort(422, 'Unsupported activity log subject type.'),
        };
    }

    public function listForSubject(string $subjectType, int $subjectId, int $tenantId): LengthAwarePaginator
    {
        return match ($subjectType) {
            'acc_vendor'   => $this->listForOwner($tenantId, [
                'acc_vendor'                  => [$subjectId],
                'acc_vendor_transaction'      => AccVendorTransaction::withTrashed()->where('vendor_id', $subjectId)->pluck('id')->all(),
                'acc_vendor_transaction_item' => AccVendorTransactionItem::withTrashed()->where('vendor_id', $subjectId)->pluck('id')->all(),
            ]),
            'acc_customer' => $this->listForOwner($tenantId, [
                'acc_customer'                  => [$subjectId],
                'acc_customer_transaction'      => AccCustomerTransaction::withTrashed()->where('customer_id', $subjectId)->pluck('id')->all(),
                'acc_customer_transaction_item' => AccCustomerTransactionItem::withTrashed()->where('customer_id', $subjectId)->pluck('id')->all(),
            ]),
            default => ActivityLog::with('user')
                ->where('tenant_id', $tenantId)
                ->where('subject_type', $subjectType)
                ->where('subject_id', $subjectId)
                ->latest()
                ->paginate(25),
        };
    }

    /** Aggregates a vendor/customer's own log rows with those of everything that belongs to
     *  it (its transactions, its transactions' line items) so the one panel shows the full
     *  history, not just direct edits to the vendor/customer record itself.
     *  $idsBySubjectType: subject_type => [subject_id, ...] to include. */
    private function listForOwner(int $tenantId, array $idsBySubjectType): LengthAwarePaginator
    {
        return ActivityLog::with('user')
            ->where('tenant_id', $tenantId)
            ->where(function ($query) use ($idsBySubjectType) {
                foreach ($idsBySubjectType as $subjectType => $ids) {
                    if (empty($ids)) {
                        continue;
                    }
                    $query->orWhere(
                        fn ($q) => $q->where('subject_type', $subjectType)->whereIn('subject_id', $ids)
                    );
                }
            })
            ->latest()
            ->paginate(25);
    }
}
