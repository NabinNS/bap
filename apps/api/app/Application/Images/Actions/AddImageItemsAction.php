<?php

namespace App\Application\Images\Actions;

use App\Domain\Images\Repositories\ImageGroupRepositoryInterface;

class AddImageItemsAction
{
    public function __construct(private ImageGroupRepositoryInterface $imageGroups) {}

    /** @param \App\Domain\Images\DTOs\ImageItemData[] $items */
    public function execute(string $ulid, int $tenantId, array $items): void
    {
        $group = $this->imageGroups->findByUlid($ulid, $tenantId);

        $this->imageGroups->addItems($group, $tenantId, $items);
    }
}
