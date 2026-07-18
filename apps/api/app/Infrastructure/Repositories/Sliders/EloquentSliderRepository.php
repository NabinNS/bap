<?php

namespace App\Infrastructure\Repositories\Sliders;

use App\Domain\Sliders\DTOs\SliderData;
use App\Domain\Sliders\DTOs\SliderFilterData;
use App\Domain\Sliders\Repositories\SliderRepositoryInterface;
use App\Models\Slider;
use Illuminate\Pagination\LengthAwarePaginator;

class EloquentSliderRepository implements SliderRepositoryInterface
{
    public function paginate(int $tenantId, int $perPage, SliderFilterData $filters): LengthAwarePaginator
    {
        return Slider::where('tenant_id', $tenantId)
            ->with('imageGroups.imageItems')
            ->when($filters->search, fn($q, $v) => $q->where('name', 'like', "%$v%"))
            ->when($filters->isActive !== null, fn($q) => $q->where('is_active', $filters->isActive))
            ->orderBy($filters->sortBy, $filters->sortDir)
            ->paginate($perPage);
    }

    public function findByUlid(int $tenantId, string $ulid): Slider
    {
        return Slider::where('tenant_id', $tenantId)
            ->where('ulid', $ulid)
            ->firstOrFail();
    }

    public function create(int $tenantId, SliderData $data): Slider
    {
        return Slider::create([
            'tenant_id'     => $tenantId,
            'name'          => $data->name,
            'is_active'     => $data->isActive,
            'sort_order'    => $data->sortOrder,
            'deadline_date' => $data->deadlineDate,
        ]);
    }

    public function update(Slider $slider, SliderData $data): Slider
    {
        $slider->update([
            'name'          => $data->name,
            'is_active'     => $data->isActive,
            'sort_order'    => $data->sortOrder,
            'deadline_date' => $data->deadlineDate,
        ]);

        return $slider->fresh();
    }

    public function delete(Slider $slider): void
    {
        $slider->delete();
    }
}
