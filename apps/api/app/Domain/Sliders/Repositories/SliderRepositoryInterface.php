<?php

namespace App\Domain\Sliders\Repositories;

use App\Domain\Sliders\DTOs\SliderData;
use App\Domain\Sliders\DTOs\SliderFilterData;
use App\Models\Slider;
use Illuminate\Pagination\LengthAwarePaginator;

interface SliderRepositoryInterface
{
    public function paginate(int $tenantId, int $perPage, SliderFilterData $filters): LengthAwarePaginator;

    public function findByUlid(int $tenantId, string $ulid): Slider;

    public function create(int $tenantId, SliderData $data): Slider;

    public function update(Slider $slider, SliderData $data): Slider;

    public function delete(Slider $slider): void;
}
