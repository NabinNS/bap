<?php

namespace App\Http\Controllers\Api;

use App\Application\Sliders\Actions\CreateSliderAction;
use App\Application\Sliders\Actions\DeleteSliderAction;
use App\Application\Sliders\Actions\ListSlidersAction;
use App\Application\Sliders\Actions\UpdateSliderAction;
use App\Domain\Sliders\DTOs\SliderFilterData;
use App\Http\Controllers\Controller;
use App\Http\Requests\Sliders\StoreSliderRequest;
use App\Http\Requests\Sliders\UpdateSliderRequest;
use App\Http\Resources\ApiResponse;
use App\Http\Resources\Sliders\SliderResource;
use App\Models\Slider;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SliderController extends Controller
{
    public function index(Request $request, ListSlidersAction $action): JsonResponse
    {
        return ApiResponse::paginated(
            $action->execute($this->tenantId(), $request->integer('per_page', 15), SliderFilterData::fromRequest($request)),
            SliderResource::class,
            'Sliders retrieved successfully'
        );
    }

    public function store(StoreSliderRequest $request, CreateSliderAction $action): JsonResponse
    {
        return ApiResponse::created(
            new SliderResource($action->execute($this->tenantId(), $request->toDTO())),
            'Slider created successfully'
        );
    }

    public function show(Request $request, Slider $slider): JsonResponse
    {
        if ($request->user()) {
            $this->authorize('view', $slider);
        }

        return ApiResponse::success(new SliderResource($slider), 'Slider retrieved successfully');
    }

    public function update(UpdateSliderRequest $request, Slider $slider, UpdateSliderAction $action): JsonResponse
    {
        $this->authorize('update', $slider);

        return ApiResponse::success(
            new SliderResource($action->execute($slider, $request->toDTO())),
            'Slider updated successfully'
        );
    }

    public function destroy(Request $request, Slider $slider, DeleteSliderAction $action): JsonResponse
    {
        $this->authorize('delete', $slider);

        $action->execute($slider);

        return ApiResponse::noContent('Slider deleted successfully');
    }
}
