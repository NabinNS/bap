<?php

namespace App\Http\Requests\Offers;

use App\Domain\Offers\DTOs\OfferData;
use Illuminate\Foundation\Http\FormRequest;

class UpdateOfferRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'title'      => ['sometimes', 'string', 'max:255'],
            'sub_title'  => ['nullable', 'string', 'max:255'],
            'is_active'  => ['boolean'],
            'sort_order' => ['integer'],
        ];
    }

    public function toDTO(): OfferData
    {
        $v = $this->validated();

        return new OfferData(
            title:     $v['title'] ?? $this->route('offer')->title,
            subTitle:  array_key_exists('sub_title', $v) ? $v['sub_title'] : $this->route('offer')->sub_title,
            isActive:  $v['is_active'] ?? $this->route('offer')->is_active,
            sortOrder: $v['sort_order'] ?? $this->route('offer')->sort_order,
        );
    }
}
