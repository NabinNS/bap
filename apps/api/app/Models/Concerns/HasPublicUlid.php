<?php

namespace App\Models\Concerns;

use Illuminate\Support\Str;

trait HasPublicUlid
{
    public static function bootHasPublicUlid(): void
    {
        static::creating(function ($model) {
            if (empty($model->ulid)) {
                $model->ulid = (string) Str::ulid();
            }
        });
    }

    public function getRouteKeyName(): string
    {
        return 'ulid';
    }

    public function resolveRouteBinding($value, $field = null): ?static
    {
        $tenantId = app()->bound('current_tenant')
            ? app('current_tenant')->id
            : request()->user()?->currentTenantId();

        return $this->where('ulid', $value)
                    ->where('tenant_id', $tenantId)
                    ->firstOrFail();
    }

    public function initializeHasPublicUlid(): void
    {
        $this->hidden[] = 'id';
    }
}
