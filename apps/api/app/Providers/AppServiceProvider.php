<?php

namespace App\Providers;

use App\Domain\Categories\Repositories\CategoryRepositoryInterface;
use App\Domain\Products\Repositories\ProductRepositoryInterface;
use App\Infrastructure\Repositories\Categories\EloquentCategoryRepository;
use App\Infrastructure\Repositories\Products\EloquentProductRepository;
use App\Models\Category;
use App\Models\Product;
use App\Policies\CategoryPolicy;
use App\Policies\ProductPolicy;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(CategoryRepositoryInterface::class, EloquentCategoryRepository::class);
        $this->app->bind(ProductRepositoryInterface::class, EloquentProductRepository::class);
    }

    public function boot(): void
    {
        Model::preventLazyLoading(app()->isLocal());

        Gate::policy(Category::class, CategoryPolicy::class);
        Gate::policy(Product::class, ProductPolicy::class);
    }
}
