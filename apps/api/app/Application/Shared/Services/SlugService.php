<?php

namespace App\Application\Shared\Services;

use Illuminate\Support\Str;

class SlugService
{
    public function resolve(?string $slug, string $name): string
    {
        return $slug ?? Str::slug($name);
    }
}
