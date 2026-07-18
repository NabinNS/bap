<?php

namespace App\Application\Sliders\Actions;

use App\Domain\Sliders\Repositories\SliderRepositoryInterface;
use App\Models\Slider;

class DeleteSliderAction
{
    public function __construct(
        private SliderRepositoryInterface $sliders,
    ) {}

    public function execute(Slider $slider): void
    {
        $this->sliders->delete($slider);
    }
}
