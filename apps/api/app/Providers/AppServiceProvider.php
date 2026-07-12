<?php

namespace App\Providers;

use App\Domain\Brands\Repositories\BrandRepositoryInterface;
use App\Domain\Categories\Repositories\CategoryRepositoryInterface;
use App\Domain\Images\Repositories\ImageGroupRepositoryInterface;
use App\Domain\Products\Repositories\ProductRepositoryInterface;
use App\Infrastructure\Repositories\Brands\EloquentBrandRepository;
use App\Infrastructure\Repositories\Categories\EloquentCategoryRepository;
use App\Infrastructure\Repositories\Images\EloquentImageGroupRepository;
use App\Infrastructure\Repositories\Products\EloquentProductRepository;
use App\Models\Brand;
use App\Models\Category;
use App\Models\ImageItem;
use App\Models\Product;
use App\Models\Tenant;
use App\Observers\ImageItemObserver;
use App\Policies\BrandPolicy;
use App\Policies\CategoryPolicy;
use App\Policies\ProductPolicy;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(BrandRepositoryInterface::class, EloquentBrandRepository::class);
        $this->app->bind(CategoryRepositoryInterface::class, EloquentCategoryRepository::class);
        $this->app->bind(ProductRepositoryInterface::class, EloquentProductRepository::class);
        $this->app->bind(ImageGroupRepositoryInterface::class, EloquentImageGroupRepository::class);
    }

    public function boot(): void
    {
        Model::preventLazyLoading(app()->isLocal());

        // Mitigation 4 — store short aliases instead of full class names in imageable_type.
        // If a model class is ever renamed, only this map needs updating — the DB rows stay valid.
        Relation::morphMap([
            'product'  => Product::class,
            'category' => Category::class,
            'tenant'   => Tenant::class,
        ]);

        // Mitigation 3 — delete the R2 file whenever an ImageItem row is deleted.
        // cascadeOnDelete on the FK handles the DB rows; the observer handles the file.
        ImageItem::observe(ImageItemObserver::class);

        Gate::policy(Brand::class, BrandPolicy::class);
        Gate::policy(Category::class, CategoryPolicy::class);
        Gate::policy(Product::class, ProductPolicy::class);
    }
}
