<?php

namespace App\Infrastructure\Storage;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class R2ImageUploader
{
    public function upload(UploadedFile $file, string $folder): array
    {
        $path   = $folder . '/' . Str::uuid() . '.' . $file->getClientOriginalExtension();
        $stream = fopen($file->getRealPath(), 'r');
        Storage::disk('r2')->writeStream($path, $stream, ['visibility' => 'public']);
        fclose($stream);

        return [
            'url'  => Storage::disk('r2')->url($path),
            'path' => $path,
        ];
    }
}
