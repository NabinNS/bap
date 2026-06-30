<?php

namespace App\Application\Products\Actions;

use App\Domain\Products\DTOs\ProductData;
use App\Domain\Products\Repositories\ProductRepositoryInterface;
use App\Application\Shared\Services\SlugService;
use App\Models\Product;

class UpdateProductAction
{
    public function __construct(
        private ProductRepositoryInterface $products,
        private SlugService $slugService,
    ) {}

    public function execute(Product $product, ProductData $data): Product
    {
        $resolved = new ProductData(
            name:        $data->name,
            slug:        $this->slugService->resolve($data->slug, $data->name),
            categoryId:  $data->categoryId,
            description: $data->description,
            image:       $data->image,
            price:       $data->price,
            stock:       $data->stock,
            isActive:    $data->isActive,
            sortOrder:   $data->sortOrder,
        );

        return $this->products->update($product, $resolved);
    }
}
