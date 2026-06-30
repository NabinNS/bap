<?php

namespace App\Domain\Products\Repositories;

use App\Domain\Products\DTOs\ProductData;
use App\Models\Product;
use Illuminate\Pagination\LengthAwarePaginator;

interface ProductRepositoryInterface
{
    public function paginate(int $tenantId, int $perPage): LengthAwarePaginator;

    public function create(int $tenantId, ProductData $data): Product;

    public function update(Product $product, ProductData $data): Product;

    public function delete(Product $product): void;
}
