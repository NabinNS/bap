<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Infrastructure\Storage\R2ImageUploader;
use Illuminate\Http\Request;

class UploadController extends Controller
{
    public function __construct(
        private R2ImageUploader $uploader,
    ) {}

    public function image(Request $request, string $folder)
    {
        $request->validate([
            'image' => ['required', 'image', 'max:' . config('upload.max_size')],
        ]);

        abort_unless(in_array($folder, config('upload.allowed_folders')), 422, 'Invalid upload folder.');

        return response()->json(
            $this->uploader->upload($request->file('image'), $folder)
        );
    }
}
