<?php

namespace App\Http\Requests\Images;

use Illuminate\Foundation\Http\FormRequest;

class UpdateImageGroupRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name' => ['required', 'string'],
        ];
    }
}
