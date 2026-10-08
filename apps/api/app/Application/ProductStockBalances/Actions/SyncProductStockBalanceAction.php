<?php

namespace App\Application\ProductStockBalances\Actions;

use App\Domain\ProductStockBalances\Repositories\ProductStockBalanceRepositoryInterface;
use App\Models\Product;
use App\Models\ProductStockBalance;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SyncProductStockBalanceAction
{
    public function __construct(
        private ProductStockBalanceRepositoryInterface $balances,
        private RecalculateProductStockBalanceAction $recalculateBalance,
    ) {}

    /**
     * Manually re-sync a product's stock balance starting from a given fiscal year, forward
     * through every later year that already tracks this product — overwriting each later
     * year's opening_quantity even if it was entered manually. Only runs when the user
     * explicitly presses "Sync Balance" (unlike RecalculateProductStockBalanceAction, which
     * only ever touches the single fiscal year it's given and never cascades on its own).
     */
    public function execute(Product $product, int $fiscalYearId): ProductStockBalance
    {
        $balance = $this->balances->find($product, $fiscalYearId);

        if (!$balance) {
            throw ValidationException::withMessages([
                'fiscal_year_id' => ['This product has no stock balance recorded for that fiscal year yet.'],
            ]);
        }

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
