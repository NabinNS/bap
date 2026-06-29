<?php

namespace App\Domain\Categories\Services;

use Illuminate\Support\Str;

class SlugService
{
    public function resolve(?string $slug, string $name): string
    {
        return $slug ?? Str::slug($name);
    }
}
