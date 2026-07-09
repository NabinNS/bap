<?php

namespace App\Application\Images\Actions;

use App\Models\ImageItem;

class DeleteImageItemAction
{
    public function execute(string $ulid, int $tenantId): void
    {
        $item = ImageItem::where('ulid', $ulid)
            ->where('tenant_id', $tenantId)
            ->firstOrFail();

        $item->delete(); // observer handles R2 deletion
    }
}
