<?php

namespace App\Domain\Settings\Repositories;

use App\Domain\Settings\DTOs\TenantSettingData;
use App\Models\TenantSetting;

interface TenantSettingRepositoryInterface
{
    public function getOrCreate(int $tenantId): TenantSetting;

    public function update(TenantSetting $setting, TenantSettingData $data): TenantSetting;
}
