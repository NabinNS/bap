<?php

namespace App\Domain\Dashboard\Repositories;

use App\Domain\Dashboard\DTOs\AgingBucket;
use App\Domain\Dashboard\DTOs\MonthlyTrendPoint;
use Illuminate\Support\Collection;

interface DashboardRepositoryInterface
{
    public function countVendors(int $tenantId): int;

    public function countCustomers(int $tenantId): int;

    public function countProducts(int $tenantId): int;

    public function countPurchaseOrders(int $tenantId, int $fiscalYearId): int;

    public function totalCustomerReceivable(int $tenantId, int $fiscalYearId): float;

    public function totalVendorPayable(int $tenantId, int $fiscalYearId): float;

    /** Sum of stock * weighted-average-cost across all products, in rupees. */
    public function stockValue(int $tenantId): float;

    public function lowStockCount(int $tenantId): int;

    /** Products at or below their low-stock threshold, most urgent first. */
    public function lowStockProducts(int $tenantId, int $limit): Collection;

    /**
     * Sum of grand_total across item-based (sales) customer transactions. A given date range
     * (both BS-calendar date strings, inclusive) takes precedence over the fiscal year filter.
     */
    public function salesTotal(int $tenantId, int $fiscalYearId, ?string $fromDate = null, ?string $toDate = null): float;

    /** Sum of grand_total across item-based (purchase) vendor transactions. See salesTotal() for date-range semantics. */
    public function purchasesTotal(int $tenantId, int $fiscalYearId, ?string $fromDate = null, ?string $toDate = null): float;

    /** Sum of cost_price * sales_quantity across sale-type stock movements, in rupees. See salesTotal() for date-range semantics. */
    public function costOfGoodsSold(int $tenantId, int $fiscalYearId, ?string $fromDate = null, ?string $toDate = null): float;

    /** @return MonthlyTrendPoint[] one entry per calendar month that had activity, ordered ascending. */
    public function monthlyTrend(int $tenantId, int $fiscalYearId, ?string $fromDate = null, ?string $toDate = null): array;

    /** Most recent item-based (sales) customer transactions, with customer loaded. */
    public function recentSalesBills(int $tenantId, int $fiscalYearId, int $limit, ?string $fromDate = null, ?string $toDate = null): Collection;

    /** Most recent item-based (purchase) vendor transactions, with vendor loaded. */
    public function recentPurchaseBills(int $tenantId, int $fiscalYearId, int $limit, ?string $fromDate = null, ?string $toDate = null): Collection;

    /** Best-selling products by revenue (sale-type stock movements), with units sold. */
    public function topProducts(int $tenantId, int $fiscalYearId, int $limit, ?string $fromDate = null, ?string $toDate = null): Collection;

    /** Highest-spending customers by total billed amount. */
    public function topCustomers(int $tenantId, int $fiscalYearId, int $limit, ?string $fromDate = null, ?string $toDate = null): Collection;

    /**
     * Sales bills bucketed into "This Month" / "Last Month" / "Earlier" by their own bill
     * date, relative to $todayBsDate (a "YYYY-MM-DD" BS-calendar date string). This is a
     * bill-age approximation, not a true per-invoice outstanding-balance aging report — the
     * schema has no due dates or payment-matching to compute that precisely.
     *
     * @return AgingBucket[]
     */
    public function receivableAgingBuckets(int $tenantId, int $fiscalYearId, string $todayBsDate): array;

    /** Purchase bills bucketed the same way as receivableAgingBuckets(). @return AgingBucket[] */
    public function payableAgingBuckets(int $tenantId, int $fiscalYearId, string $todayBsDate): array;
}
