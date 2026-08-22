<?php

namespace App\Application\Settings\Actions;

use App\Domain\Settings\DTOs\TenantSettingData;
use App\Domain\Settings\Repositories\TenantSettingRepositoryInterface;
use App\Models\TenantSetting;

class UpdateTenantSettingsAction
{
    public function __construct(
        private TenantSettingRepositoryInterface $settings,
    ) {}

    public function execute(TenantSetting $setting, TenantSettingData $data): TenantSetting
    {
        return $this->settings->update($setting, $data);
    }
}
