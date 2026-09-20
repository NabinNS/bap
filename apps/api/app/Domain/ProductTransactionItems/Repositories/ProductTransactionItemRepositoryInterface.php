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

    /** @return Collection<int, ProductTransactionItem> */
    public function trashed(Product $product): Collection;

    public function restore(int $tenantId, Product $product, string $itemUlid): ProductTransactionItem;

    public function create(int $tenantId, Product $product, ProductTransactionItemData $data): ProductTransactionItem;

    /** Locks the row for update — use inside a DB transaction when the caller will reverse/adjust stock. */
    public function lockForUpdate(ProductTransactionItem $item): ProductTransactionItem;

    public function update(ProductTransactionItem $item, ProductTransactionItemData $data): ProductTransactionItem;

    public function delete(ProductTransactionItem $item): void;
}
