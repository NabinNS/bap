<?php

namespace App\Application\ProductStockBalances\Actions;

use App\Domain\ProductStockBalances\DTOs\ProductStockBalanceData;
use App\Domain\ProductStockBalances\Repositories\ProductStockBalanceRepositoryInterface;
use App\Domain\Settings\Repositories\TenantSettingRepositoryInterface;
use App\Models\Product;
use App\Models\ProductStockBalance;
use Illuminate\Validation\ValidationException;

class UpsertProductStockBalanceAction
{
    public function __construct(
        private ProductStockBalanceRepositoryInterface $balances,
        private TenantSettingRepositoryInterface $settings,
        private RecalculateProductStockBalanceAction $recalculateBalance,
    ) {}

    public function execute(int $tenantId, Product $product, ProductStockBalanceData $data): ProductStockBalance
    {
        $fiscalYearId = $data->fiscalYearId ?: $this->settings->getOrCreate($tenantId)->fiscal_year_id;

        if (!$fiscalYearId) {
            throw ValidationException::withMessages([
                'fiscal_year_id' => ['No active fiscal year set. Please configure it in Settings.'],
            ]);
        }

        $balance = $this->balances->upsert($product, $fiscalYearId, $data->openingQuantity);

        $this->recalculateBalance->execute($product, $fiscalYearId);

        return $balance->fresh();
    }
}
