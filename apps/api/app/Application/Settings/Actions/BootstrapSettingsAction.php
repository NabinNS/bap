<?php

namespace App\Application\Settings\Actions;

use App\Models\FiscalYear;
use App\Models\Tenant;
use App\Models\TenantSetting;

class BootstrapSettingsAction
{
    public function __construct(
        private GetTenantSettingsAction $getSettings,
    ) {}

    public function execute(int $tenantId): array
    {
        return [
            'tenant'       => Tenant::findOrFail($tenantId),
            'settings'     => $this->getSettings->execute($tenantId),
            'fiscal_years' => FiscalYear::orderBy('sort_order')->get(),
        ];
    }
}
