<?php

namespace Tests\Unit\Products;

use App\Application\Products\Actions\DeleteProductAction;
use App\Application\Products\Actions\ListTrashedProductsAction;
use App\Application\Products\Actions\RestoreProductAction;
use App\Models\Product;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Covers product soft-delete + restore, added this session since Product previously had no
 * restore path at all despite using SoftDeletes.
 */
class DeleteRestoreProductActionTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;

    protected function setUp(): void
    {
        parent::setUp();

        $user = User::create(['name' => 'Test User', 'email' => 'test-'.uniqid().'@example.com', 'password' => 'secret']);
        $this->tenant = Tenant::create(['name' => 'Test Tenant', 'slug' => 'test-tenant-'.uniqid(), 'created_by' => $user->id]);
    }

    private function makeProduct(): Product
    {
        return Product::create([
            'tenant_id'   => $this->tenant->id,
            'name'        => 'Test Product',
            'sku'         => 'SKU-1',
            'slug'        => 'test-product-'.uniqid(),
            'cost_price'  => 100,
            'sales_price' => 150,
            'stock'       => 5,
            'is_active'   => true,
            'is_featured' => false,
        ]);
    }

    public function test_deleting_a_product_soft_deletes_it(): void
    {
        $product = $this->makeProduct();

        app(DeleteProductAction::class)->execute($product);

        $this->assertSoftDeleted('products', ['id' => $product->id]);
        $this->assertNull(Product::find($product->id));
    }

    public function test_deleted_product_appears_in_trashed_list(): void
    {
        $product = $this->makeProduct();
        app(DeleteProductAction::class)->execute($product);

        $trashed = app(ListTrashedProductsAction::class)->execute($this->tenant->id);

        $this->assertCount(1, $trashed);
        $this->assertSame($product->ulid, $trashed->first()->ulid);
    }

    public function test_restoring_a_product_brings_it_back(): void
    {
        $product = $this->makeProduct();
        app(DeleteProductAction::class)->execute($product);

        $restored = app(RestoreProductAction::class)->execute($this->tenant->id, $product->ulid);

        $this->assertNotSoftDeleted('products', ['id' => $product->id]);
        $this->assertSame($product->stock, $restored->stock);
    }

    public function test_restore_is_scoped_to_tenant(): void
    {
        $otherUser = User::create(['name' => 'Other User', 'email' => 'other-'.uniqid().'@example.com', 'password' => 'secret']);
        $otherTenant = Tenant::create(['name' => 'Other Tenant', 'slug' => 'other-tenant-'.uniqid(), 'created_by' => $otherUser->id]);

        $product = $this->makeProduct();
        app(DeleteProductAction::class)->execute($product);

        $this->expectException(\Illuminate\Database\Eloquent\ModelNotFoundException::class);
        app(RestoreProductAction::class)->execute($otherTenant->id, $product->ulid);
    }
}
