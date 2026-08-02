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
            name:             $data->name,
            brandId:          $data->brandId,
            sku:              $data->sku,
            slug:             $this->slugService->resolve($data->slug, $data->name),
            categoryId:       $data->categoryId,
            description:      $data->description,
            image:            $data->image,
            price:            $data->price,
            costPrice:        $data->costPrice,
            salesPrice:       $data->salesPrice,
            discountPercent:  $data->discountPercent,
            stock:            $data->stock,
            lowStockQuantity: $data->lowStockQuantity,
            isActive:         $data->isActive,
            isFeatured:       $data->isFeatured,
            sortOrder:        $data->sortOrder,
        );

        return $this->products->update($product, $resolved);
    }
}
