<?php

namespace App\Application\AccQuotations\Actions;

use App\Domain\AccQuotations\DTOs\AccQuotationData;
use App\Domain\AccQuotations\Repositories\AccQuotationRepositoryInterface;
use App\Domain\Settings\Repositories\TenantSettingRepositoryInterface;
use App\Models\AccCustomer;
use App\Models\AccQuotation;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class StoreAccQuotationAction
{
    public function __construct(
        private AccQuotationRepositoryInterface $quotations,
        private TenantSettingRepositoryInterface $settings,
        private RecordAccQuotationItemAction $recordItem,
    ) {}

    public function execute(int $tenantId, AccCustomer $customer, AccQuotationData $data): AccQuotation
    {
        $settings = $this->settings->getOrCreate($tenantId);

        // Defaults to the tenant's active fiscal year; the caller may target a different
        // (e.g. past) one explicitly.
        $fiscalYearId = $data->fiscalYearId ?? $settings->fiscal_year_id;

        if (!$fiscalYearId) {
            throw ValidationException::withMessages([
                'fiscal_year_id' => ['No active fiscal year set. Please configure it in Settings.'],
            ]);
        }

        return DB::transaction(function () use ($tenantId, $customer, $fiscalYearId, $data) {
            $quotation = $this->quotations->create($tenantId, $customer, $fiscalYearId, $data);

            foreach ($data->items as $item) {
                $this->recordItem->execute($tenantId, $quotation, $item);
            }

            return $quotation->fresh();
        });
    }
}
