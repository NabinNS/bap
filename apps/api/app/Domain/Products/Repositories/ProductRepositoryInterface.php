<?php

namespace App\Domain\Products\Repositories;

use App\Domain\Products\DTOs\ProductData;
use App\Domain\Products\DTOs\ProductFilterData;
use App\Models\Product;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

interface ProductRepositoryInterface
{
    public function paginate(int $tenantId, int $perPage, ProductFilterData $filters): LengthAwarePaginator;

    /** Minimal fields, no relations — for type-ahead pickers. */
    public function searchLite(int $tenantId, ?string $search, int $limit): Collection;

    public function findByUlid(int $tenantId, string $ulid): Product;

    /** Locks the row for update — use inside a DB transaction when the caller will adjust stock/cost. */
    public function lockByUlid(int $tenantId, string $ulid): Product;

    /** Same as lockByUlid, but by primary key — for reversing a transaction item's stock effect, which only stores product_id. */
    public function lockById(int $tenantId, int $id): Product;

    public function updateStockAndCost(Product $product, int $stock, int $wacc): Product;

    public function create(int $tenantId, ProductData $data): Product;

    public function update(Product $product, ProductData $data): Product;

    public function delete(Product $product): void;

    /** @return \Illuminate\Support\Collection<int, Product> */
    public function trashed(int $tenantId): \Illuminate\Support\Collection;

    /** @param int[] $ids @return \Illuminate\Support\Collection<int, Product> */
    public function findByIds(int $tenantId, array $ids): \Illuminate\Support\Collection;

    /**
     * Restore a soft-deleted product by ulid (implicit route-model-binding can't resolve a
     * trashed row, so this looks it up explicitly rather than taking a bound model).
     */
    public function restore(int $tenantId, string $ulid): Product;
}
