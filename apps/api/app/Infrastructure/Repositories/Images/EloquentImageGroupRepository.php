<?php

namespace App\Infrastructure\Repositories\Images;

use App\Domain\Images\DTOs\ImageGroupData;
use App\Domain\Images\DTOs\ImageItemData;
use App\Domain\Images\Repositories\ImageGroupRepositoryInterface;
use App\Models\Brand;
use App\Models\Category;
use App\Models\ImageGroup;
use App\Models\ImageItem;
use App\Models\Product;
use Illuminate\Support\Collection;

class EloquentImageGroupRepository implements ImageGroupRepositoryInterface
{
    public function listForImageable(string $imageableType, int $imageableId, int $tenantId): Collection
    {
        return ImageGroup::with('imageItems')
            ->where('imageable_type', $imageableType)
            ->where('imageable_id', $imageableId)
            ->where('tenant_id', $tenantId)
            ->orderBy('sort_order')
            ->get();
    }

    public function findByUlid(string $ulid, int $tenantId): ImageGroup
    {
        return ImageGroup::where('ulid', $ulid)
            ->where('tenant_id', $tenantId)
            ->firstOrFail();
    }

    public function firstOrCreate(int $imageableId, int $tenantId, ImageGroupData $data): ImageGroup
    {
        return ImageGroup::firstOrCreate(
            [
                'imageable_type' => $data->imageableType,
                'imageable_id'   => $imageableId,
                'slug'           => $data->slug,
            ],
            [
                'tenant_id' => $tenantId,
                'name'      => $data->name,
            ]
        );
    }

    public function updateName(ImageGroup $group, string $name): ImageGroup
    {
        $group->update(['name' => $name]);

        return $group->fresh();
    }

    public function addItems(ImageGroup $group, int $tenantId, array $items): void
    {
        foreach ($items as $item) {
            ImageItem::create([
                'tenant_id'      => $tenantId,
                'image_group_id' => $group->id,
                'url'            => $item->url,
                'path'           => $item->path,
                'sort_order'     => $item->sortOrder,
            ]);
        }
    }

    public function resolveImageableId(string $type, string $ulid, int $tenantId): int
    {
        return match ($type) {
            'product'  => Product::where('ulid', $ulid)->where('tenant_id', $tenantId)->firstOrFail()->id,
            'brand'    => Brand::where('ulid', $ulid)->where('tenant_id', $tenantId)->firstOrFail()->id,
            'category' => Category::where('ulid', $ulid)->where('tenant_id', $tenantId)->firstOrFail()->id,
            default    => abort(422, 'Unsupported imageable type.'),
        };
    }
}
