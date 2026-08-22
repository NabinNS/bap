<?php

namespace App\Application\Settings\Actions;

use App\Domain\Settings\Repositories\TenantSettingRepositoryInterface;
use App\Models\TenantSetting;

class GetTenantSettingsAction
{
    public function __construct(
        private TenantSettingRepositoryInterface $settings,
    ) {}

    public function execute(int $tenantId): TenantSetting
    {
        $setting = $this->settings->getOrCreate($tenantId);
        $setting->load('fiscalYear');

        return $setting;
    }
}
