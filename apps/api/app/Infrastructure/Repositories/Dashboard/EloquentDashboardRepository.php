<?php

namespace App\Infrastructure\Repositories\Dashboard;

use App\Domain\Dashboard\DTOs\AgingBucket;
use App\Domain\Dashboard\DTOs\MonthlyTrendPoint;
use App\Domain\Dashboard\Repositories\DashboardRepositoryInterface;
use App\Models\AccCustomerBalance;
use App\Models\AccCustomerTransaction;
use App\Models\AccPurchaseOrder;
use App\Models\AccVendor;
use App\Models\AccVendorBalance;
use App\Models\AccVendorTransaction;
use App\Models\AccCustomer;
use App\Models\Product;
use App\Models\ProductTransactionItem;
use Illuminate\Support\Collection;

class EloquentDashboardRepository implements DashboardRepositoryInterface
{
    public function countVendors(int $tenantId): int
    {
        return AccVendor::where('tenant_id', $tenantId)->count();
    }

    public function countCustomers(int $tenantId): int
    {
        return AccCustomer::where('tenant_id', $tenantId)->count();
    }

    public function countProducts(int $tenantId): int
    {
        return Product::where('tenant_id', $tenantId)->count();
    }

    public function countPurchaseOrders(int $tenantId, int $fiscalYearId): int
    {
        return AccPurchaseOrder::where('tenant_id', $tenantId)
            ->where('fiscal_year_id', $fiscalYearId)
            ->count();
    }

    public function totalCustomerReceivable(int $tenantId, int $fiscalYearId): float
    {
        return (float) AccCustomerBalance::where('tenant_id', $tenantId)
            ->where('fiscal_year_id', $fiscalYearId)
            ->sum('remaining_balance');
    }

    public function totalVendorPayable(int $tenantId, int $fiscalYearId): float
    {
        return (float) AccVendorBalance::where('tenant_id', $tenantId)
            ->where('fiscal_year_id', $fiscalYearId)
            ->sum('remaining_balance');
    }

    public function stockValue(int $tenantId): float
    {
        $cents = (float) Product::where('tenant_id', $tenantId)
            ->selectRaw('COALESCE(SUM(stock * wacc), 0) as total')
            ->value('total');

        return $cents / 100;
    }

    public function lowStockCount(int $tenantId): int
    {
        return Product::where('tenant_id', $tenantId)
            ->whereColumn('stock', '<=', 'low_stock_quantity')
            ->count();
    }

    public function lowStockProducts(int $tenantId, int $limit): Collection
    {
        return Product::where('tenant_id', $tenantId)
            ->whereColumn('stock', '<=', 'low_stock_quantity')
            ->orderBy('stock')
            ->limit($limit)
            ->get();
    }

    public function salesTotal(int $tenantId, int $fiscalYearId, ?string $fromDate = null, ?string $toDate = null): float
    {
        return (float) $this->itemBasedTransactions(AccCustomerTransaction::class, $tenantId, $fiscalYearId, $fromDate, $toDate)
            ->get(['date', 'bill_details'])
            ->sum('grand_total');
    }

    public function purchasesTotal(int $tenantId, int $fiscalYearId, ?string $fromDate = null, ?string $toDate = null): float
    {
        return (float) $this->itemBasedTransactions(AccVendorTransaction::class, $tenantId, $fiscalYearId, $fromDate, $toDate)
            ->get(['date', 'bill_details'])
            ->sum('grand_total');
    }

    public function costOfGoodsSold(int $tenantId, int $fiscalYearId, ?string $fromDate = null, ?string $toDate = null): float
    {
        $cents = (float) $this->saleStockMovements($tenantId, $fiscalYearId, $fromDate, $toDate)
            ->selectRaw('COALESCE(SUM(cost_price * sales_quantity), 0) as total')
            ->value('total');

        return $cents / 100;
    }

    public function monthlyTrend(int $tenantId, int $fiscalYearId, ?string $fromDate = null, ?string $toDate = null): array
    {
        $revenueByMonth = $this->itemBasedTransactions(AccCustomerTransaction::class, $tenantId, $fiscalYearId, $fromDate, $toDate)
            ->get(['date', 'bill_details'])
            ->groupBy(fn (AccCustomerTransaction $t) => substr($t->date, 0, 7))
            ->map(fn (Collection $rows) => $rows->sum('grand_total'));

        $costByMonth = $this->saleStockMovements($tenantId, $fiscalYearId, $fromDate, $toDate)
            ->selectRaw('substr(date, 1, 7) as month, COALESCE(SUM(cost_price * sales_quantity), 0) as total_cents')
            ->groupBy('month')
            ->pluck('total_cents', 'month')
            ->map(fn ($cents) => (float) $cents / 100);

        $months = $revenueByMonth->keys()->merge($costByMonth->keys())->unique()->sort()->values();

        return $months->map(fn (string $month) => new MonthlyTrendPoint(
            month: $month,
            revenue: (float) ($revenueByMonth[$month] ?? 0),
            cost: (float) ($costByMonth[$month] ?? 0),
        ))->all();
    }

    public function recentSalesBills(int $tenantId, int $fiscalYearId, int $limit, ?string $fromDate = null, ?string $toDate = null): Collection
    {
        return $this->itemBasedTransactions(AccCustomerTransaction::class, $tenantId, $fiscalYearId, $fromDate, $toDate)
            ->with('customer')
            ->orderBy('date', 'desc')
            ->limit($limit)
            ->get();
    }

    public function recentPurchaseBills(int $tenantId, int $fiscalYearId, int $limit, ?string $fromDate = null, ?string $toDate = null): Collection
    {
        return $this->itemBasedTransactions(AccVendorTransaction::class, $tenantId, $fiscalYearId, $fromDate, $toDate)
            ->with('vendor')
            ->orderBy('date', 'desc')
            ->limit($limit)
            ->get();
    }

    public function topProducts(int $tenantId, int $fiscalYearId, int $limit, ?string $fromDate = null, ?string $toDate = null): Collection
    {
        return $this->saleStockMovements($tenantId, $fiscalYearId, $fromDate, $toDate)
            ->join('products', 'products.id', '=', 'product_transaction_items.product_id')
            ->groupBy('products.id', 'products.ulid', 'products.name', 'products.sku')
            ->selectRaw('products.id, products.ulid, products.name, products.sku, SUM(product_transaction_items.sales_quantity) as units_sold, SUM(product_transaction_items.sales_price * product_transaction_items.sales_quantity) as revenue_cents')
            ->orderByDesc('revenue_cents')
            ->limit($limit)
            ->get()
            ->map(fn ($row) => (object) [
                'ulid' => $row->ulid,
                'name' => $row->name,
                'sku' => $row->sku,
                'units_sold' => (int) $row->units_sold,
                'revenue' => (float) $row->revenue_cents / 100,
            ]);
    }

    public function topCustomers(int $tenantId, int $fiscalYearId, int $limit, ?string $fromDate = null, ?string $toDate = null): Collection
    {
        return $this->itemBasedTransactions(AccCustomerTransaction::class, $tenantId, $fiscalYearId, $fromDate, $toDate)
            ->with('customer')
            ->get(['customer_id', 'bill_details'])
            ->groupBy('customer_id')
            ->map(fn (Collection $rows) => (object) [
                'ulid' => $rows->first()->customer?->ulid,
                'name' => $rows->first()->customer?->name,
                'bill_count' => $rows->count(),
                'revenue' => (float) $rows->sum('grand_total'),
            ])
            ->sortByDesc('revenue')
            ->take($limit)
            ->values();
    }

    public function receivableAgingBuckets(int $tenantId, int $fiscalYearId, string $todayBsDate): array
    {
        return $this->agingBuckets(AccCustomerTransaction::class, $tenantId, $fiscalYearId, $todayBsDate);
    }

    public function payableAgingBuckets(int $tenantId, int $fiscalYearId, string $todayBsDate): array
    {
        return $this->agingBuckets(AccVendorTransaction::class, $tenantId, $fiscalYearId, $todayBsDate);
    }

    /** @param class-string<AccCustomerTransaction|AccVendorTransaction> $model */
    private function agingBuckets(string $model, int $tenantId, int $fiscalYearId, string $todayBsDate): array
    {
        $thisMonth = substr($todayBsDate, 0, 7);
        $lastMonth = $this->previousBsMonth($thisMonth);

        $byMonth = $this->itemBasedTransactions($model, $tenantId, $fiscalYearId)
            ->get(['date', 'bill_details'])
            ->groupBy(fn ($t) => substr($t->date, 0, 7) === $thisMonth
                ? 'this_month'
                : (substr($t->date, 0, 7) === $lastMonth ? 'last_month' : 'earlier'))
            ->map(fn (Collection $rows) => (float) $rows->sum('grand_total'));

        return [
            new AgingBucket('This Month', (float) ($byMonth['this_month'] ?? 0)),
            new AgingBucket('Last Month', (float) ($byMonth['last_month'] ?? 0)),
            new AgingBucket('Earlier', (float) ($byMonth['earlier'] ?? 0)),
        ];
    }

    /** @param string $month "YYYY-MM" */
    private function previousBsMonth(string $month): string
    {
        [$year, $monthNum] = array_map('intval', explode('-', $month));

        return $monthNum > 1
            ? sprintf('%04d-%02d', $year, $monthNum - 1)
            : sprintf('%04d-%02d', $year - 1, 12);
    }

    /**
     * Item-based (bill) transactions for a tenant. When a date range is given it takes
     * precedence over the fiscal year filter, since a custom range (e.g. "last 30 days")
     * may straddle a fiscal year boundary.
     *
     * @param class-string<AccCustomerTransaction|AccVendorTransaction> $model
     */
    private function itemBasedTransactions(
        string $model,
        int $tenantId,
        int $fiscalYearId,
        ?string $fromDate = null,
        ?string $toDate = null,
    ): \Illuminate\Database\Eloquent\Builder {
        return $model::where('tenant_id', $tenantId)
            ->when(
                $fromDate && $toDate,
                fn ($query) => $query->whereBetween('date', [$fromDate, $toDate]),
                fn ($query) => $query->where('fiscal_year_id', $fiscalYearId),
            )
            ->whereHas('items');
    }

    private function saleStockMovements(
        int $tenantId,
        int $fiscalYearId,
        ?string $fromDate = null,
        ?string $toDate = null,
    ): \Illuminate\Database\Eloquent\Builder {
        return ProductTransactionItem::where('product_transaction_items.tenant_id', $tenantId)
            ->where('product_transaction_items.type', 'sale')
            ->when(
                $fromDate && $toDate,
                fn ($query) => $query->whereBetween('product_transaction_items.date', [$fromDate, $toDate]),
                fn ($query) => $query->where('product_transaction_items.fiscal_year_id', $fiscalYearId),
            );
    }
}
