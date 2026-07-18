<?php

namespace App\Http\Requests\Sliders;

use App\Domain\Sliders\DTOs\SliderData;
use Illuminate\Foundation\Http\FormRequest;

class StoreSliderRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name'          => ['required', 'string', 'max:255'],
            'is_active'     => ['boolean'],
            'sort_order'    => ['integer'],
            'deadline_date' => ['nullable', 'string'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required'      => 'Slider name is required.',
            'name.max'           => 'Slider name cannot exceed 255 characters.',
            'is_active.boolean'  => 'The active status must be true or false.',
            'sort_order.integer' => 'Sort order must be a whole number.',
        ];
    }

    public function toDTO(): SliderData
    {
        $v = $this->validated();

        return new SliderData(
            name:         $v['name'],
            isActive:     $v['is_active'] ?? true,
            sortOrder:    $v['sort_order'] ?? 0,
            deadlineDate: $v['deadline_date'] ?? null,
        );
    }
}
