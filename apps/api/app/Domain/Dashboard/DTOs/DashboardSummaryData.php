<?php

namespace App\Domain\Dashboard\DTOs;

use Illuminate\Support\Collection;

readonly class DashboardSummaryData
{
    public function __construct(
        public ?int $fiscalYearId,
        public int $vendorCount,
        public int $customerCount,
        public int $productCount,
        public int $purchaseOrderCount,
        public float $totalReceivable,
        public float $totalPayable,
        public float $stockValue,
        public int $lowStockCount,
        public float $revenue,
        public float $costOfGoodsSold,
        public float $profit,
        public float $purchases,
        /** @var MonthlyTrendPoint[] */
        public array $monthlyTrend,
        public Collection $recentSalesBills,
        public Collection $recentPurchaseBills,
        public Collection $lowStockProducts,
        public Collection $topProducts,
        public Collection $topCustomers,
        /** @var AgingBucket[] */
        public array $receivableAging,
        /** @var AgingBucket[] */
        public array $payableAging,
    ) {}
}
