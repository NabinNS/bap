<?php

namespace App\Application\Dashboard\Actions;

use App\Domain\Dashboard\DTOs\DashboardSummaryData;
use App\Domain\Dashboard\Repositories\DashboardRepositoryInterface;
use App\Domain\Settings\Repositories\TenantSettingRepositoryInterface;
use Illuminate\Support\Collection;

class GetDashboardSummaryAction
{
    public function __construct(
        private DashboardRepositoryInterface $dashboard,
        private TenantSettingRepositoryInterface $settings,
    ) {}

    public function execute(
        int $tenantId,
        ?int $fiscalYearId = null,
        ?string $fromDate = null,
        ?string $toDate = null,
        ?string $todayBsDate = null,
    ): DashboardSummaryData {
        $fiscalYearId = $fiscalYearId ?: $this->settings->getOrCreate($tenantId)->fiscal_year_id;
        $hasRange = $fiscalYearId !== null;

        $revenue = $hasRange ? $this->dashboard->salesTotal($tenantId, $fiscalYearId, $fromDate, $toDate) : 0.0;
        $cost = $hasRange ? $this->dashboard->costOfGoodsSold($tenantId, $fiscalYearId, $fromDate, $toDate) : 0.0;

        return new DashboardSummaryData(
            fiscalYearId: $fiscalYearId,
            vendorCount: $this->dashboard->countVendors($tenantId),
            customerCount: $this->dashboard->countCustomers($tenantId),
            productCount: $this->dashboard->countProducts($tenantId),
            purchaseOrderCount: $fiscalYearId ? $this->dashboard->countPurchaseOrders($tenantId, $fiscalYearId) : 0,
            totalReceivable: $fiscalYearId ? $this->dashboard->totalCustomerReceivable($tenantId, $fiscalYearId) : 0.0,
            totalPayable: $fiscalYearId ? $this->dashboard->totalVendorPayable($tenantId, $fiscalYearId) : 0.0,
            stockValue: $this->dashboard->stockValue($tenantId),
            lowStockCount: $this->dashboard->lowStockCount($tenantId),
            revenue: $revenue,
            costOfGoodsSold: $cost,
            profit: $revenue - $cost,
            purchases: $hasRange ? $this->dashboard->purchasesTotal($tenantId, $fiscalYearId, $fromDate, $toDate) : 0.0,
            monthlyTrend: $hasRange ? $this->dashboard->monthlyTrend($tenantId, $fiscalYearId, $fromDate, $toDate) : [],
            recentSalesBills: $hasRange ? $this->dashboard->recentSalesBills($tenantId, $fiscalYearId, 5, $fromDate, $toDate) : new Collection(),
            recentPurchaseBills: $hasRange ? $this->dashboard->recentPurchaseBills($tenantId, $fiscalYearId, 5, $fromDate, $toDate) : new Collection(),
            lowStockProducts: $this->dashboard->lowStockProducts($tenantId, 5),
            topProducts: $hasRange ? $this->dashboard->topProducts($tenantId, $fiscalYearId, 5, $fromDate, $toDate) : new Collection(),
            topCustomers: $hasRange ? $this->dashboard->topCustomers($tenantId, $fiscalYearId, 5, $fromDate, $toDate) : new Collection(),
            receivableAging: $hasRange && $todayBsDate ? $this->dashboard->receivableAgingBuckets($tenantId, $fiscalYearId, $todayBsDate) : [],
            payableAging: $hasRange && $todayBsDate ? $this->dashboard->payableAgingBuckets($tenantId, $fiscalYearId, $todayBsDate) : [],
        );
    }
}
