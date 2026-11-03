<?php

namespace App\Providers;

use App\Domain\ActivityLogs\Repositories\ActivityLogRepositoryInterface;
use App\Infrastructure\Repositories\ActivityLogs\EloquentActivityLogRepository;
use App\Domain\Dashboard\Repositories\DashboardRepositoryInterface;
use App\Infrastructure\Repositories\Dashboard\EloquentDashboardRepository;
use App\Domain\AccVendors\Repositories\AccVendorRepositoryInterface;
use App\Domain\AccVendors\Repositories\AccVendorBalanceRepositoryInterface;
use App\Domain\AccVendors\Repositories\AccVendorTransactionRepositoryInterface;
use App\Domain\AccCustomers\Repositories\AccCustomerRepositoryInterface;
use App\Domain\AccCustomers\Repositories\AccCustomerBalanceRepositoryInterface;
use App\Domain\AccCustomers\Repositories\AccCustomerTransactionRepositoryInterface;
use App\Domain\AccQuotations\Repositories\AccQuotationRepositoryInterface;
use App\Infrastructure\Repositories\AccQuotations\EloquentAccQuotationRepository;
use App\Domain\AccPurchaseOrders\Repositories\AccPurchaseOrderRepositoryInterface;
use App\Infrastructure\Repositories\AccPurchaseOrders\EloquentAccPurchaseOrderRepository;
use App\Domain\Settings\Repositories\TenantSettingRepositoryInterface;
use App\Infrastructure\Repositories\Settings\EloquentTenantSettingRepository;
use App\Domain\Brands\Repositories\BrandRepositoryInterface;
use App\Domain\Offers\Repositories\OfferRepositoryInterface;
use App\Domain\Sliders\Repositories\SliderRepositoryInterface;
use App\Domain\Categories\Repositories\CategoryRepositoryInterface;
use App\Domain\Images\Repositories\ImageGroupRepositoryInterface;
use App\Domain\Products\Repositories\ProductDiscountRepositoryInterface;
use App\Domain\Products\Repositories\ProductRepositoryInterface;
use App\Domain\ProductTransactionItems\Repositories\ProductTransactionItemRepositoryInterface;
use App\Infrastructure\Repositories\ProductTransactionItems\EloquentProductTransactionItemRepository;
use App\Domain\ProductStockBalances\Repositories\ProductStockBalanceRepositoryInterface;
use App\Infrastructure\Repositories\ProductStockBalances\EloquentProductStockBalanceRepository;
use App\Infrastructure\Repositories\AccVendors\EloquentAccVendorRepository;
use App\Infrastructure\Repositories\AccVendors\EloquentAccVendorBalanceRepository;
use App\Infrastructure\Repositories\AccVendors\EloquentAccVendorTransactionRepository;
use App\Infrastructure\Repositories\AccCustomers\EloquentAccCustomerRepository;
use App\Infrastructure\Repositories\AccCustomers\EloquentAccCustomerBalanceRepository;
use App\Infrastructure\Repositories\AccCustomers\EloquentAccCustomerTransactionRepository;
use App\Infrastructure\Repositories\Brands\EloquentBrandRepository;
use App\Infrastructure\Repositories\Offers\EloquentOfferRepository;
use App\Infrastructure\Repositories\Sliders\EloquentSliderRepository;
use App\Infrastructure\Repositories\Categories\EloquentCategoryRepository;
use App\Infrastructure\Repositories\Images\EloquentImageGroupRepository;
use App\Infrastructure\Repositories\Products\EloquentProductDiscountRepository;
use App\Infrastructure\Repositories\Products\EloquentProductRepository;
use App\Models\Brand;
use App\Models\Category;
use App\Models\ImageItem;
use App\Models\Offer;
use App\Models\Product;
use App\Models\Slider;
use App\Models\Tenant;
use App\Observers\ImageItemObserver;
use App\Models\AccVendor;
use App\Models\AccVendorTransaction;
use App\Models\AccVendorTransactionItem;
use App\Models\AccCustomer;
use App\Models\AccCustomerTransaction;
use App\Models\AccCustomerTransactionItem;
use App\Models\AccQuotation;
use App\Models\AccQuotationItem;
use App\Models\ProductTransactionItem;
use App\Observers\ActivityLogObserver;
use App\Policies\AccVendorPolicy;
use App\Policies\AccCustomerPolicy;
use App\Policies\BrandPolicy;
use App\Policies\CategoryPolicy;
use App\Policies\OfferPolicy;
use App\Policies\ProductPolicy;
use App\Policies\SliderPolicy;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(DashboardRepositoryInterface::class, EloquentDashboardRepository::class);
        $this->app->bind(ActivityLogRepositoryInterface::class, EloquentActivityLogRepository::class);
        $this->app->bind(AccVendorRepositoryInterface::class, EloquentAccVendorRepository::class);
        $this->app->bind(AccVendorBalanceRepositoryInterface::class, EloquentAccVendorBalanceRepository::class);
        $this->app->bind(AccVendorTransactionRepositoryInterface::class, EloquentAccVendorTransactionRepository::class);
        $this->app->bind(AccCustomerRepositoryInterface::class, EloquentAccCustomerRepository::class);
        $this->app->bind(AccCustomerBalanceRepositoryInterface::class, EloquentAccCustomerBalanceRepository::class);
        $this->app->bind(AccCustomerTransactionRepositoryInterface::class, EloquentAccCustomerTransactionRepository::class);
        $this->app->bind(AccQuotationRepositoryInterface::class, EloquentAccQuotationRepository::class);
        $this->app->bind(AccPurchaseOrderRepositoryInterface::class, EloquentAccPurchaseOrderRepository::class);
        $this->app->bind(BrandRepositoryInterface::class, EloquentBrandRepository::class);
        $this->app->bind(CategoryRepositoryInterface::class, EloquentCategoryRepository::class);
        $this->app->bind(ProductRepositoryInterface::class, EloquentProductRepository::class);
        $this->app->bind(ProductDiscountRepositoryInterface::class, EloquentProductDiscountRepository::class);
        $this->app->bind(ImageGroupRepositoryInterface::class, EloquentImageGroupRepository::class);
        $this->app->bind(SliderRepositoryInterface::class, EloquentSliderRepository::class);
        $this->app->bind(OfferRepositoryInterface::class, EloquentOfferRepository::class);
        $this->app->bind(TenantSettingRepositoryInterface::class, EloquentTenantSettingRepository::class);
        $this->app->bind(ProductTransactionItemRepositoryInterface::class, EloquentProductTransactionItemRepository::class);
        $this->app->bind(ProductStockBalanceRepositoryInterface::class, EloquentProductStockBalanceRepository::class);
    }

    public function boot(): void
    {
        Model::preventLazyLoading(app()->isLocal());

        // Mitigation 4 — store short aliases instead of full class names in imageable_type.
        // If a model class is ever renamed, only this map needs updating — the DB rows stay valid.
        Relation::morphMap([
            'product'  => Product::class,
            'category' => Category::class,
            'brand'    => Brand::class,
            'slider'   => Slider::class,
            'offer'    => Offer::class,
            'tenant'   => Tenant::class,
            'acc_vendor_transaction' => AccVendorTransaction::class,
            'acc_customer_transaction' => AccCustomerTransaction::class,
            'acc_quotation' => AccQuotation::class,
            'product_transaction_item' => ProductTransactionItem::class,
            'acc_customer' => AccCustomer::class,
            'acc_vendor' => AccVendor::class,
            'acc_vendor_transaction_item' => AccVendorTransactionItem::class,
            'acc_customer_transaction_item' => AccCustomerTransactionItem::class,
            'acc_quotation_item' => AccQuotationItem::class,
        ]);

        // Mitigation 3 — delete the R2 file whenever an ImageItem row is deleted.
        // cascadeOnDelete on the FK handles the DB rows; the observer handles the file.
        ImageItem::observe(ImageItemObserver::class);

        // Record an ActivityLog row for every create/update/delete on these transaction-like models.
        AccCustomerTransaction::observe(ActivityLogObserver::class);
        AccVendorTransaction::observe(ActivityLogObserver::class);
        AccQuotation::observe(ActivityLogObserver::class);
        ProductTransactionItem::observe(ActivityLogObserver::class);
        AccCustomer::observe(ActivityLogObserver::class);
        AccVendor::observe(ActivityLogObserver::class);
        AccVendorTransactionItem::observe(ActivityLogObserver::class);
        AccCustomerTransactionItem::observe(ActivityLogObserver::class);
        AccQuotationItem::observe(ActivityLogObserver::class);

        Gate::policy(AccVendor::class, AccVendorPolicy::class);
        Gate::policy(AccCustomer::class, AccCustomerPolicy::class);
        Gate::policy(Brand::class, BrandPolicy::class);
        Gate::policy(Category::class, CategoryPolicy::class);
        Gate::policy(Product::class, ProductPolicy::class);
        Gate::policy(Slider::class, SliderPolicy::class);
        Gate::policy(Offer::class, OfferPolicy::class);
    }
}
