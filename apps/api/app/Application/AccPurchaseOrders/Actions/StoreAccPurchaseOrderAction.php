<?php

namespace App\Application\AccPurchaseOrders\Actions;

use App\Domain\AccPurchaseOrders\DTOs\AccPurchaseOrderData;
use App\Domain\AccPurchaseOrders\Repositories\AccPurchaseOrderRepositoryInterface;
use App\Domain\Settings\Repositories\TenantSettingRepositoryInterface;
use App\Models\AccPurchaseOrder;
use App\Models\AccVendor;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class StoreAccPurchaseOrderAction
{
    public function __construct(
        private AccPurchaseOrderRepositoryInterface $purchaseOrders,
        private TenantSettingRepositoryInterface $settings,
        private AddAccPurchaseOrderItemAction $addItem,
    ) {}

    public function execute(int $tenantId, AccVendor $vendor, AccPurchaseOrderData $data): AccPurchaseOrder
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

        return DB::transaction(function () use ($tenantId, $vendor, $fiscalYearId, $data) {
            $purchaseOrder = $this->purchaseOrders->create($tenantId, $vendor, $fiscalYearId, $data);

            foreach ($data->items as $item) {
                $this->addItem->execute($tenantId, $purchaseOrder, $item);
            }

            return $purchaseOrder->fresh();
        });
    }
}
