<?php

namespace App\Application\Sliders\Actions;

use App\Domain\Sliders\DTOs\SliderData;
use App\Domain\Sliders\Repositories\SliderRepositoryInterface;
use App\Models\Slider;

class CreateSliderAction
{
    public function __construct(
        private SliderRepositoryInterface $sliders,
    ) {}

    public function execute(int $tenantId, SliderData $data): Slider
    {
        return $this->sliders->create($tenantId, $data);
    }
}
