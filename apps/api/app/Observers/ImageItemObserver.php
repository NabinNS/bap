<?php

namespace App\Observers;

use App\Models\ImageItem;
use Illuminate\Support\Facades\Storage;

class ImageItemObserver
{
    // Fires when an ImageItem row is deleted — removes the file from R2
    public function deleted(ImageItem $item): void
    {
        // path is the R2 storage key, e.g. "products/filename.jpg"
        if ($item->path && Storage::disk('r2')->exists($item->path)) {
            Storage::disk('r2')->delete($item->path);
        }
    }
}
