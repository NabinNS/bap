<?php

namespace App\Application\Images\Actions;

use App\Domain\Images\Repositories\ImageGroupRepositoryInterface;
use Illuminate\Support\Collection;

class ListImageGroupsAction
{
    public function __construct(private ImageGroupRepositoryInterface $imageGroups) {}

    public function execute(string $imageableType, string $imageableUlid, int $tenantId): Collection
    {
        $imageableId = $this->imageGroups->resolveImageableId($imageableType, $imageableUlid, $tenantId);

        return $this->imageGroups->listForImageable($imageableType, $imageableId, $tenantId);
    }
}
