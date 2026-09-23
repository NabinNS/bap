<?php

namespace Tests\Unit\ProductTransactionItems;

use App\Application\ProductTransactionItems\Actions\CreateProductTransactionItemAction;
use App\Application\ProductTransactionItems\Actions\UpdateProductTransactionItemAction;
use App\Domain\ProductTransactionItems\DTOs\ProductTransactionItemData;
use App\Models\FiscalYear;
use App\Models\Product;
use App\Models\Tenant;
use App\Models\TenantSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

/**
 * Covers the WACC blend and overselling guard in CreateProductTransactionItemAction /
 * UpdateProductTransactionItemAction — the shared engine every vendor purchase, customer
 * sale, and direct stock entry routes through. This was previously entirely untested.
 */
class CreateProductTransactionItemActionTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;
    private FiscalYear $fiscalYear;

    protected function setUp(): void
    {
        parent::setUp();

        $user = User::create(['name' => 'Test User', 'email' => 'test-'.uniqid().'@example.com', 'password' => 'secret']);
        $this->tenant = Tenant::create(['name' => 'Test Tenant', 'slug' => 'test-tenant-'.uniqid(), 'created_by' => $user->id]);
        $this->fiscalYear = FiscalYear::create(['name' => '2082/083', 'sort_order' => 1]);
        TenantSetting::create(['tenant_id' => $this->tenant->id, 'fiscal_year_id' => $this->fiscalYear->id]);
    }

    private function makeProduct(array $overrides = []): Product
    {
        return Product::create(array_merge([
            'tenant_id'   => $this->tenant->id,
            'name'        => 'Test Product',
            'sku'         => 'SKU-1',
            'slug'        => 'test-product-'.uniqid(),
            'cost_price'  => 100,
            'wacc'        => null,
            'sales_price' => 150,
            'stock'       => 0,
            'is_active'   => true,
            'is_featured' => false,
        ], $overrides));
    }

    private function purchase(int $qty, int $price): ProductTransactionItemData
    {
        return new ProductTransactionItemData(
            fiscalYearId: $this->fiscalYear->id,
            date: '2082-01-01',
            type: 'purchase',
            purchaseQuantity: $qty,
            purchasePrice: $price,
            salesQuantity: null,
            salesPrice: null,
        );
    }

    private function sale(int $qty, int $price): ProductTransactionItemData
    {
        return new ProductTransactionItemData(
            fiscalYearId: $this->fiscalYear->id,
            date: '2082-01-02',
            type: 'sale',
            purchaseQuantity: null,
            purchasePrice: null,
            salesQuantity: $qty,
            salesPrice: $price,
        );
    }

    public function test_first_purchase_sets_wacc_to_purchase_price(): void
    {
        $product = $this->makeProduct();
        $action = app(CreateProductTransactionItemAction::class);

        $action->execute($this->tenant->id, $product, $this->purchase(5, 100));

        $product->refresh();
        $this->assertSame(5, $product->stock);
        $this->assertSame(100, $product->wacc);
    }

    public function test_second_purchase_blends_wacc_as_weighted_average(): void
    {
        $product = $this->makeProduct();
        $action = app(CreateProductTransactionItemAction::class);

        $action->execute($this->tenant->id, $product, $this->purchase(5, 100));
        $action->execute($this->tenant->id, $product, $this->purchase(5, 150));

        $product->refresh();
        // (5*100 + 5*150) / 10 = 125
        $this->assertSame(10, $product->stock);
        $this->assertSame(125, $product->wacc);
    }

    public function test_sale_decrements_stock_and_leaves_wacc_untouched(): void
    {
        $product = $this->makeProduct();
        $action = app(CreateProductTransactionItemAction::class);

        $action->execute($this->tenant->id, $product, $this->purchase(10, 100));
        $item = $action->execute($this->tenant->id, $product, $this->sale(4, 150));

        $product->refresh();
        $this->assertSame(6, $product->stock);
        $this->assertSame(100, $product->wacc);
        // Profit snapshot: cost_price captured at time of sale.
        $this->assertSame(100, $item->cost_price);
    }

    public function test_selling_more_than_available_stock_is_rejected(): void
    {
        $product = $this->makeProduct();
        $action = app(CreateProductTransactionItemAction::class);

        $action->execute($this->tenant->id, $product, $this->purchase(3, 100));

        $this->expectException(ValidationException::class);
        $action->execute($this->tenant->id, $product, $this->sale(4, 150));
    }

    public function test_selling_more_than_available_stock_on_update_is_rejected(): void
    {
        $product = $this->makeProduct();
        $create = app(CreateProductTransactionItemAction::class);
        $update = app(UpdateProductTransactionItemAction::class);

        $create->execute($this->tenant->id, $product, $this->purchase(5, 100));
        $item = $create->execute($this->tenant->id, $product, $this->sale(2, 150));

        // Product now has 3 left (5 - 2). Reversing this sale during the update puts it back
        // to 5 — try to bump the quantity to 6, past even that reversed total.
        $this->expectException(ValidationException::class);
        $update->execute($this->tenant->id, $product, $item, $this->sale(6, 150));
    }

    public function test_sale_does_not_clamp_stock_to_zero_on_reject(): void
    {
        $product = $this->makeProduct();
        $action = app(CreateProductTransactionItemAction::class);

        $action->execute($this->tenant->id, $product, $this->purchase(3, 100));

        try {
            $action->execute($this->tenant->id, $product, $this->sale(10, 150));
        } catch (ValidationException) {
            // expected
        }

        $product->refresh();
        // Stock must be unchanged by the rejected sale.
        $this->assertSame(3, $product->stock);
    }
}
