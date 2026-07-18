<?php

namespace App\Application\Sliders\Actions;

use App\Domain\Sliders\DTOs\SliderData;
use App\Domain\Sliders\Repositories\SliderRepositoryInterface;
use App\Models\Slider;

class UpdateSliderAction
{
    public function __construct(
        private SliderRepositoryInterface $sliders,
    ) {}

    public function execute(Slider $slider, SliderData $data): Slider
    {
        return $this->sliders->update($slider, $data);
    }
}
