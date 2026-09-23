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
            referenceType:    $data->referenceType,
            referenceId:      $data->referenceId,
        );

        return DB::transaction(function () use ($tenantId, $product, $data) {
            $locked = $this->products->lockByUlid($tenantId, $product->ulid);

            // Snapshot the cost basis before it's touched — a sale doesn't change wacc, but
            // capturing it here (rather than reading it back later) keeps this correct even if
            // that ever changes.
            if ($data->type === 'sale') {
                $data = new ProductTransactionItemData(
                    fiscalYearId:     $data->fiscalYearId,
                    date:             $data->date,
                    type:             $data->type,
                    purchaseQuantity: $data->purchaseQuantity,
                    purchasePrice:    $data->purchasePrice,
                    salesQuantity:    $data->salesQuantity,
                    salesPrice:       $data->salesPrice,
                    referenceType:    $data->referenceType,
                    referenceId:      $data->referenceId,
                    costPrice:        $locked->wacc ?? 0,
                );
            }

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

        // Sale: stock decreases; cost basis (wacc) of what remains is unaffected. Reject
        // selling more than what's actually on hand rather than silently clamping to 0 —
        // that would desync recorded stock from what's real and overstate what was sold.
        if ($data->salesQuantity > $product->stock) {
            throw ValidationException::withMessages([
                'sales_quantity' => ["Only {$product->stock} unit(s) of \"{$product->name}\" in stock."],
            ]);
        }

        $newStock = $product->stock - $data->salesQuantity;
        $this->products->updateStockAndCost($product, $newStock, $product->wacc ?? 0);
    }
}
