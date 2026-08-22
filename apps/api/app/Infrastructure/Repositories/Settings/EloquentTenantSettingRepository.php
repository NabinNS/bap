<?php

namespace App\Infrastructure\Repositories\Settings;

use App\Domain\Settings\DTOs\TenantSettingData;
use App\Domain\Settings\Repositories\TenantSettingRepositoryInterface;
use App\Models\TenantSetting;

class EloquentTenantSettingRepository implements TenantSettingRepositoryInterface
{
    public function getOrCreate(int $tenantId): TenantSetting
    {
        return TenantSetting::firstOrCreate(
            ['tenant_id' => $tenantId],
        );
    }

    public function update(TenantSetting $setting, TenantSettingData $data): TenantSetting
    {
        $setting->update([
            'fiscal_year_id' => $data->fiscalYearId,
            'meta'           => $data->meta,
        ]);

        return $setting->fresh(['fiscalYear']);
    }
}
