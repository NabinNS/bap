<?php

namespace App\Domain\Images\Repositories;

use App\Domain\Images\DTOs\ImageGroupData;
use App\Domain\Images\DTOs\ImageItemData;
use App\Models\ImageGroup;
use Illuminate\Support\Collection;

interface ImageGroupRepositoryInterface
{
    public function listForImageable(string $imageableType, int $imageableId, int $tenantId): Collection;

    public function findByUlid(string $ulid, int $tenantId): ImageGroup;

    public function firstOrCreate(int $imageableId, int $tenantId, ImageGroupData $data): ImageGroup;

    public function updateName(ImageGroup $group, string $name): ImageGroup;

    /** @param ImageItemData[] $items */
    public function addItems(ImageGroup $group, int $tenantId, array $items): void;

    public function resolveImageableId(string $type, string $ulid, int $tenantId): int;
}
