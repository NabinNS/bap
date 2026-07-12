<?php

namespace App\Http\Requests\Images;

use Illuminate\Foundation\Http\FormRequest;

class ListImageGroupsRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'imageable_type' => ['required', 'string'],
            'imageable_ulid' => ['required', 'string'],
        ];
    }
}
