<?php

namespace App\Application\AccVendors\Actions;

use App\Domain\Settings\Repositories\TenantSettingRepositoryInterface;
use App\Models\AccVendor;
use App\Models\AccVendorTransaction;
use Illuminate\Validation\ValidationException;

class StoreAccVendorTransactionAction
{
    public function __construct(
        private TenantSettingRepositoryInterface $settings,
    ) {}

    public function execute(int $tenantId, AccVendor $vendor, array $data): AccVendorTransaction
    {
        $settings = $this->settings->getOrCreate($tenantId);

        if (!$settings->fiscal_year_id) {
            throw ValidationException::withMessages([
                'fiscal_year_id' => ['No active fiscal year set. Please configure it in Settings.'],
            ]);
        }

        return $vendor->transactions()->create([
            'tenant_id'      => $tenantId,
            'fiscal_year_id' => $settings->fiscal_year_id,
            'date'           => $data['date'],
            'particular'     => $data['particular'],
            'voucher_no'     => $data['voucher_no'] ?? null,
            'debit'          => $data['debit'] ?? null,
            'credit'         => $data['credit'] ?? null,
        ]);
    }
}
