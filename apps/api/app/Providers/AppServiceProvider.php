<?php

namespace App\Providers;

use App\Domain\Categories\Repositories\CategoryRepositoryInterface;
use App\Infrastructure\Repositories\Categories\EloquentCategoryRepository;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(CategoryRepositoryInterface::class, EloquentCategoryRepository::class);
    }

    public function boot(): void
    {
        //
    }
}
