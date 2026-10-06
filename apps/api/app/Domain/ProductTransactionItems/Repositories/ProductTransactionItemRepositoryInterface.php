<?php

namespace App\Domain\ProductTransactionItems\Repositories;

use App\Domain\ProductTransactionItems\DTOs\ProductTransactionItemData;
use App\Models\Product;
use App\Models\ProductTransactionItem;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

interface ProductTransactionItemRepositoryInterface
{
    public function paginate(Product $product, int $perPage): LengthAwarePaginator;

    public function netQuantity(Product $product, int $fiscalYearId): int;

    /**
     * Net quantity (purchases - sales) per product for a tenant's fiscal year, in one query.
     * Only products with at least one transaction item appear in the result — absence of a
     * key means that product has no transaction items in this fiscal year.
     *
     * @return array<int, int> product_id => net quantity
     */
    public function netQuantitiesForFiscalYear(int $tenantId, int $fiscalYearId): array;

    /** @return Collection<int, ProductTransactionItem> */
    public function trashed(Product $product): Collection;

    public function restore(int $tenantId, Product $product, string $itemUlid): ProductTransactionItem;

    public function create(int $tenantId, Product $product, ProductTransactionItemData $data): ProductTransactionItem;

    public function findByReference(int $tenantId, string $referenceType, int $referenceId): ?ProductTransactionItem;

    /** Locks the row for update — use inside a DB transaction when the caller will reverse/adjust stock. */
    public function lockForUpdate(ProductTransactionItem $item): ProductTransactionItem;

    public function update(ProductTransactionItem $item, ProductTransactionItemData $data): ProductTransactionItem;

    public function delete(ProductTransactionItem $item): void;
}
