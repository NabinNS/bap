<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ApiResponse;
use App\Models\ImageGroup;
use App\Models\ImageItem;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ImageGroupController extends Controller
{
    private function resolveImageable(string $type, string $ulid, int $tenantId): \Illuminate\Database\Eloquent\Model
    {
        return match ($type) {
            'product' => Product::where('ulid', $ulid)->where('tenant_id', $tenantId)->firstOrFail(),
            default   => abort(422, 'Unsupported imageable type.'),
        };
    }

    public function index(Request $request): JsonResponse
    {
        $data = $request->validate([
            'imageable_type' => ['required', 'string', 'in:product'],
            'imageable_ulid' => ['required', 'string'],
        ]);

        $imageable = $this->resolveImageable($data['imageable_type'], $data['imageable_ulid'], $request->user()->currentTenantId());

        $groups = ImageGroup::with('imageItems')
            ->where('imageable_type', $data['imageable_type'])
            ->where('imageable_id', $imageable->id)
            ->where('tenant_id', $request->user()->currentTenantId())
            ->orderBy('sort_order')
            ->get()
            ->map(fn ($group) => [
                'ulid'  => $group->ulid,
                'slug'  => $group->slug,
                'name'  => $group->name,
                'items' => $group->imageItems->map(fn ($item) => [
                    'ulid'       => $item->ulid,
                    'url'        => $item->url,
                    'path'       => $item->path,
                    'sort_order' => $item->sort_order,
                ]),
            ]);

        return ApiResponse::success($groups, 'Image groups retrieved');
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'imageable_type' => ['required', 'string', 'in:product'],
            'imageable_ulid' => ['required', 'string'],
            'slug'           => ['required', 'string'],
            'name'           => ['required', 'string'],
        ]);

        $imageable = $this->resolveImageable($data['imageable_type'], $data['imageable_ulid'], $request->user()->currentTenantId());

        $group = ImageGroup::firstOrCreate(
            [
                'imageable_type' => $data['imageable_type'],
                'imageable_id'   => $imageable->id,
                'slug'           => $data['slug'],
            ],
            [
                'tenant_id' => $request->user()->currentTenantId(),
                'name'      => $data['name'],
            ]
        );

        return ApiResponse::created(['ulid' => $group->ulid], 'Image group ready');
    }

    public function update(Request $request, string $ulid): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string'],
        ]);

        $group = ImageGroup::where('ulid', $ulid)
            ->where('tenant_id', $request->user()->currentTenantId())
            ->firstOrFail();

        $group->update(['name' => $data['name']]);

        return ApiResponse::success(['ulid' => $group->ulid, 'name' => $group->name], 'Group name updated');
    }

    public function destroyItem(Request $request, string $ulid): JsonResponse
    {
        $item = ImageItem::where('ulid', $ulid)
            ->where('tenant_id', $request->user()->currentTenantId())
            ->firstOrFail();

        $item->delete(); // observer handles R2 deletion

        return ApiResponse::noContent('Image deleted successfully');
    }

    public function storeItems(Request $request, string $ulid): JsonResponse
    {
        $request->validate([
            'items'              => ['required', 'array', 'min:1'],
            'items.*.url'        => ['required', 'string'],
            'items.*.path'       => ['required', 'string'],
            'items.*.sort_order' => ['integer'],
        ]);

        $group = ImageGroup::where('ulid', $ulid)
            ->where('tenant_id', $request->user()->currentTenantId())
            ->firstOrFail();

        $tenantId = $request->user()->currentTenantId();

        foreach ($request->items as $i => $item) {
            ImageItem::create([
                'tenant_id'      => $tenantId,
                'image_group_id' => $group->id,
                'url'            => $item['url'],
                'path'           => $item['path'],
                'sort_order'     => $item['sort_order'] ?? $i,
            ]);
        }

        return ApiResponse::created(null, 'Images saved successfully');
    }
}
