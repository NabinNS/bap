<?php

namespace App\Application\Images\Actions;

use App\Domain\Images\Repositories\ImageGroupRepositoryInterface;
use App\Models\ImageGroup;

class UpdateImageGroupAction
{
    public function __construct(private ImageGroupRepositoryInterface $imageGroups) {}

    public function execute(string $ulid, int $tenantId, string $name): ImageGroup
    {
        $group = $this->imageGroups->findByUlid($ulid, $tenantId);

        return $this->imageGroups->updateName($group, $name);
    }
}
