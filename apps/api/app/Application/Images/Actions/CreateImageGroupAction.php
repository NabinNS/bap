<?php

namespace App\Application\Images\Actions;

use App\Domain\Images\DTOs\ImageGroupData;
use App\Domain\Images\Repositories\ImageGroupRepositoryInterface;
use App\Models\ImageGroup;

class CreateImageGroupAction
{
    public function __construct(private ImageGroupRepositoryInterface $imageGroups) {}

    public function execute(int $tenantId, ImageGroupData $data): ImageGroup
    {
        $imageableId = $this->imageGroups->resolveImageableId($data->imageableType, $data->imageableUlid, $tenantId);

        return $this->imageGroups->firstOrCreate($imageableId, $tenantId, $data);
    }
}
