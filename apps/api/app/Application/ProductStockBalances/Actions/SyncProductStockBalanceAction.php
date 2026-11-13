<?php

namespace App\Application\ProductStockBalances\Actions;

use App\Domain\ProductStockBalances\Repositories\ProductStockBalanceRepositoryInterface;
use App\Models\Product;
use App\Models\ProductStockBalance;
use Illuminate\Support\Facades\DB;

class SyncProductStockBalanceAction
{
    public function __construct(
        private ProductStockBalanceRepositoryInterface $balances,
        private RecalculateProductStockBalanceAction $recalculateBalance,
    ) {}

    /**
     * Re-sync a product's stock balance starting from a given fiscal year, forward through
     * every later year that already tracks this product — overwriting each later year's
     * opening_quantity with the prior year's recalculated remaining_quantity. Runs both from
     * the explicit "Sync Balance" button and automatically after every transaction-item write
     * (see Create/Update/Delete/RestoreProductTransactionItemAction), so a later year's stock
     * balance can never go stale relative to an earlier year's transaction items.
     *
     * The starting year's balance row is created on demand (via RecalculateProductStockBalanceAction)
     * if it doesn't exist yet, same as a plain recalculation would.
     */
    public function execute(Product $product, int $fiscalYearId): ProductStockBalance
    {
        return DB::transaction(function () use ($product, $fiscalYearId) {
            $currentFiscalYearId = $fiscalYearId;

            for ($i = 0; $i < 500; $i++) {
                $this->recalculateBalance->execute($product, $currentFiscalYearId);
                $current = $this->balances->find($product, $currentFiscalYearId);

                $next = $this->balances->nextFiscalYearBalance($product, $currentFiscalYearId);

                if (!$next) {
                    break;
                }

                $this->balances->upsert($product, $next->fiscal_year_id, $current->remaining_quantity);
                $currentFiscalYearId = $next->fiscal_year_id;
            }

            return $this->balances->find($product, $fiscalYearId);
        });
    }
}
