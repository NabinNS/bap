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

class UpdateProductTransactionItemAction
{
    public function __construct(
        private ProductTransactionItemRepositoryInterface $items,
        private ProductRepositoryInterface $products,
        private ReverseProductTransactionItemAction $reverseItem,
        private TenantSettingRepositoryInterface $settings,
        private RecalculateProductStockBalanceAction $recalculateBalance,
    ) {}

    public function execute(int $tenantId, Product $product, ProductTransactionItem $item, ProductTransactionItemData $data): ProductTransactionItem
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

        return DB::transaction(function () use ($tenantId, $product, $item, $data) {
            $item = $this->items->lockForUpdate($item);
            $locked   = $this->products->lockByUlid($tenantId, $product->ulid);
            $oldFiscalYearId = $item->fiscal_year_id;

            // Undo the old movement's stock/wacc contribution first, then blend in the new
            // one on top — composes correctly even when type/quantity/price all changed.
            $this->reverseItem->execute($locked, $item);
            $locked->refresh();

            $this->applyToProduct($locked, $data);

            $updated = $this->items->update($item, $data);

            $this->recalculateBalance->execute($locked, $data->fiscalYearId);

            if ($oldFiscalYearId !== $data->fiscalYearId) {
                $this->recalculateBalance->execute($locked, $oldFiscalYearId);
            }

            return $updated;
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

        $newStock = max(0, $product->stock - $data->salesQuantity);
        $this->products->updateStockAndCost($product, $newStock, $product->wacc ?? 0);
    }
}
