<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class UploadController extends Controller
{
    public function image(Request $request, string $folder)
    {
        $request->validate([
            'image' => ['required', 'image', 'max:' . config('upload.max_size')],
        ]);

        abort_unless(in_array($folder, config('upload.allowed_folders')), 422, 'Invalid upload folder.');

        $file = $request->file('image');
        $path = $folder . '/' . Str::uuid() . '.' . $file->getClientOriginalExtension();

        $stream = fopen($file->getRealPath(), 'r');
        Storage::disk('r2')->writeStream($path, $stream, ['visibility' => 'public']);
        fclose($stream);

        return response()->json([
            'url' => Storage::disk('r2')->url($path),
            'path' => $path,
        ]);
    }
}
