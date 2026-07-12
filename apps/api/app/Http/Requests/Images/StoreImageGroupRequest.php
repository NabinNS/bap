<?php

namespace App\Http\Requests\Images;

use App\Domain\Images\DTOs\ImageGroupData;
use Illuminate\Foundation\Http\FormRequest;

class StoreImageGroupRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'imageable_type' => ['required', 'string'],
            'imageable_ulid' => ['required', 'string'],
            'slug'           => ['required', 'string'],
            'name'           => ['required', 'string'],
        ];
    }

    public function toDTO(): ImageGroupData
    {
        $v = $this->validated();

        return new ImageGroupData(
            imageableType: $v['imageable_type'],
            imageableUlid: $v['imageable_ulid'],
            slug:          $v['slug'],
            name:          $v['name'],
        );
    }
}
