<?php

namespace App\Http\Requests\Offers;

use App\Domain\Offers\DTOs\OfferData;
use Illuminate\Foundation\Http\FormRequest;

class StoreOfferRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'title'      => ['required', 'string', 'max:255'],
            'sub_title'  => ['nullable', 'string', 'max:255'],
            'is_active'  => ['boolean'],
            'sort_order' => ['integer'],
        ];
    }

    public function messages(): array
    {
        return [
            'title.required'     => 'Offer title is required.',
            'title.max'          => 'Offer title cannot exceed 255 characters.',
            'is_active.boolean'  => 'The active status must be true or false.',
            'sort_order.integer' => 'Sort order must be a whole number.',
        ];
    }

    public function toDTO(): OfferData
    {
        $v = $this->validated();

        return new OfferData(
            title:     $v['title'],
            subTitle:  $v['sub_title'] ?? null,
            isActive:  $v['is_active'] ?? true,
            sortOrder: $v['sort_order'] ?? 0,
        );
    }
}
