<?php

namespace App\Http\Requests\ActivityLogs;

use Illuminate\Foundation\Http\FormRequest;

class ListActivityLogsRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'subject_type' => ['required', 'string'],
            'subject_ulid' => ['required', 'string'],
        ];
    }
}
