<?php

namespace App\Application\Sliders\Actions;

use App\Domain\Sliders\DTOs\SliderFilterData;
use App\Domain\Sliders\Repositories\SliderRepositoryInterface;
use Illuminate\Pagination\LengthAwarePaginator;

class ListSlidersAction
{
    public function __construct(
        private SliderRepositoryInterface $sliders,
    ) {}

    public function execute(int $tenantId, int $perPage = 15, SliderFilterData $filters = new SliderFilterData()): LengthAwarePaginator
    {
        return $this->sliders->paginate($tenantId, $perPage, $filters);
    }
}
