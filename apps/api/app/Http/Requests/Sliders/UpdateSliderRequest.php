<?php

namespace App\Http\Requests\Sliders;

use App\Domain\Sliders\DTOs\SliderData;
use Illuminate\Foundation\Http\FormRequest;

class UpdateSliderRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name'          => ['sometimes', 'string', 'max:255'],
            'is_active'     => ['boolean'],
            'sort_order'    => ['integer'],
            'deadline_date' => ['nullable', 'string'],
        ];
    }

    public function toDTO(): SliderData
    {
        $v = $this->validated();

        return new SliderData(
            name:         $v['name'] ?? $this->route('slider')->name,
            isActive:     $v['is_active'] ?? $this->route('slider')->is_active,
            sortOrder:    $v['sort_order'] ?? $this->route('slider')->sort_order,
            deadlineDate: $v['deadline_date'] ?? $this->route('slider')->deadline_date,
        );
    }
}
