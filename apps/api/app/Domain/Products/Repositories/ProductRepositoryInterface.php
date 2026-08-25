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

    public function create(int $tenantId, ProductData $data): Product;

    public function update(Product $product, ProductData $data): Product;

    public function delete(Product $product): void;
}
