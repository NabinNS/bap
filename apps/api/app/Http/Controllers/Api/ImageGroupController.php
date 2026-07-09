<?php

namespace App\Http\Controllers\Api;

use App\Application\Images\Actions\AddImageItemsAction;
use App\Application\Images\Actions\CreateImageGroupAction;
use App\Application\Images\Actions\DeleteImageItemAction;
use App\Application\Images\Actions\ListImageGroupsAction;
use App\Application\Images\Actions\UpdateImageGroupAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Images\ListImageGroupsRequest;
use App\Http\Requests\Images\StoreImageGroupRequest;
use App\Http\Requests\Images\StoreImageItemsRequest;
use App\Http\Requests\Images\UpdateImageGroupRequest;
use App\Http\Resources\ApiResponse;
use App\Http\Resources\Images\ImageGroupResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ImageGroupController extends Controller
{
    public function index(ListImageGroupsRequest $request, ListImageGroupsAction $action): JsonResponse
    {
        $v      = $request->validated();
        $groups = $action->execute($v['imageable_type'], $v['imageable_ulid'], $request->user()->currentTenantId());

        return ApiResponse::success(ImageGroupResource::collection($groups), 'Image groups retrieved');
    }

    public function store(StoreImageGroupRequest $request, CreateImageGroupAction $action): JsonResponse
    {
        $group = $action->execute($request->user()->currentTenantId(), $request->toDTO());

        return ApiResponse::created(['ulid' => $group->ulid], 'Image group ready');
    }

    public function update(UpdateImageGroupRequest $request, string $ulid, UpdateImageGroupAction $action): JsonResponse
    {
        $group = $action->execute($ulid, $request->user()->currentTenantId(), $request->validated('name'));

        return ApiResponse::success(['ulid' => $group->ulid, 'name' => $group->name], 'Group name updated');
    }

    public function storeItems(StoreImageItemsRequest $request, string $ulid, AddImageItemsAction $action): JsonResponse
    {
        $action->execute($ulid, $request->user()->currentTenantId(), $request->toDTOs());

        return ApiResponse::created(null, 'Images saved successfully');
    }

    public function destroyItem(Request $request, string $ulid, DeleteImageItemAction $action): JsonResponse
    {
        $action->execute($ulid, $request->user()->currentTenantId());

        return ApiResponse::noContent('Image deleted successfully');
    }
}
