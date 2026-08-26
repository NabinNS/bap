<?php

namespace App\Application\AccVendors\Actions;

use App\Domain\Settings\Repositories\TenantSettingRepositoryInterface;
use App\Models\AccVendor;
use App\Models\AccVendorTransaction;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class StoreAccVendorTransactionAction
{
    public function __construct(
        private TenantSettingRepositoryInterface $settings,
        private RecordAccVendorTransactionItemAction $recordItem,
    ) {}

    public function execute(int $tenantId, AccVendor $vendor, array $data): AccVendorTransaction
    {
        $settings = $this->settings->getOrCreate($tenantId);

        if (!$settings->fiscal_year_id) {
            throw ValidationException::withMessages([
                'fiscal_year_id' => ['No active fiscal year set. Please configure it in Settings.'],
            ]);
        }

        $items = $data['items'] ?? [];

        return DB::transaction(function () use ($tenantId, $vendor, $settings, $data, $items) {
            $transaction = $vendor->transactions()->create([
                'tenant_id'      => $tenantId,
                'fiscal_year_id' => $settings->fiscal_year_id,
                'date'           => $data['date'],
                'particular'     => $data['particular'],
                'voucher_no'     => $data['voucher_no'] ?? null,
                'cheque_no'      => $data['cheque_no'] ?? null,
                // When items are supplied, debit is derived from their amounts (see below);
                // otherwise use the manually entered debit/credit (plain ledger entry).
                'debit'  => $items ? 0 : ($data['debit'] ?? null),
                'credit' => $data['credit'] ?? null,
                // Applied to the very first item's totals recalculation below, if given.
                'bill_details' => isset($data['discount_percent']) ? ['discount_percent' => $data['discount_percent']] : null,
            ]);

            foreach ($items as $item) {
                $this->recordItem->execute($tenantId, $vendor, $transaction, $item);
            }

            return $transaction->fresh();
        });
    }
}
