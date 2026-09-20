<?php

namespace App\Application\ProductTransactionItems\Actions;

use App\Application\ProductStockBalances\Actions\RecalculateProductStockBalanceAction;
use App\Domain\Products\Repositories\ProductRepositoryInterface;
use App\Domain\ProductTransactionItems\DTOs\ProductTransactionItemData;
use App\Domain\ProductTransactionItems\Repositories\ProductTransactionItemRepositoryInterface;
use App\Domain\Settings\Repositories\TenantSettingRepositoryInterface;
use App\Models\Product;
use App\Models\ProductTransactionItem;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CreateProductTransactionItemAction
{
    public function __construct(
        private ProductTransactionItemRepositoryInterface $items,
        private ProductRepositoryInterface $products,
        private TenantSettingRepositoryInterface $settings,
        private RecalculateProductStockBalanceAction $recalculateBalance,
    ) {}

    /**
     * Record one purchase/sale movement and roll it into the product's stock (and, for a
     * purchase, its weighted-average cost) — same blend used by the vendor purchase flow.
     */
    public function execute(int $tenantId, Product $product, ProductTransactionItemData $data): ProductTransactionItem
    {
        $fiscalYearId = $data->fiscalYearId ?: $this->settings->getOrCreate($tenantId)->fiscal_year_id;

        if (!$fiscalYearId) {
            throw ValidationException::withMessages([
                'fiscal_year_id' => ['No active fiscal year set. Please configure it in Settings.'],
            ]);
        }

        $data = new ProductTransactionItemData(
            fiscalYearId:     $fiscalYearId,
            date:             $data->date,
            type:             $data->type,
            purchaseQuantity: $data->purchaseQuantity,
            purchasePrice:    $data->purchasePrice,
            salesQuantity:    $data->salesQuantity,
            salesPrice:       $data->salesPrice,
        );

        return DB::transaction(function () use ($tenantId, $product, $data) {
            $locked = $this->products->lockByUlid($tenantId, $product->ulid);

            $this->applyToProduct($locked, $data);

            $item = $this->items->create($tenantId, $locked, $data);

            $this->recalculateBalance->execute($locked, $data->fiscalYearId);

            return $item;
        });
    }

    private function applyToProduct(Product $product, ProductTransactionItemData $data): void
    {
        if ($data->type === 'purchase') {
            $currentStock = $product->stock;
            $currentCost  = $product->wacc ?? $data->purchasePrice;
            $newStock     = $currentStock + $data->purchaseQuantity;

            $newWacc = $newStock > 0
                ? (int) round((($currentStock * $currentCost) + ($data->purchaseQuantity * $data->purchasePrice)) / $newStock)
                : $data->purchasePrice;

            $this->products->updateStockAndCost($product, $newStock, $newWacc);

            return;
        }

        // Sale: stock decreases; cost basis (wacc) of what remains is unaffected.
        $newStock = max(0, $product->stock - $data->salesQuantity);
        $this->products->updateStockAndCost($product, $newStock, $product->wacc ?? 0);
    }
}
