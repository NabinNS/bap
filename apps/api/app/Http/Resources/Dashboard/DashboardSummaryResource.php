<?php

namespace App\Http\Resources\Dashboard;

use App\Http\Resources\AccCustomers\AccCustomerTransactionResource;
use App\Http\Resources\AccVendors\AccVendorTransactionResource;
use App\Http\Resources\Products\ProductLiteResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DashboardSummaryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'fiscal_year_id' => $this->fiscalYearId,
            'counts' => [
                'vendors'         => $this->vendorCount,
                'customers'       => $this->customerCount,
                'products'        => $this->productCount,
                'purchase_orders' => $this->purchaseOrderCount,
            ],
            'receivable'      => $this->totalReceivable,
            'payable'         => $this->totalPayable,
            'stock_value'     => $this->stockValue,
            'low_stock_count' => $this->lowStockCount,
            'revenue'         => $this->revenue,
            'cost_of_goods_sold' => $this->costOfGoodsSold,
            'profit'          => $this->profit,
            'purchases'       => $this->purchases,
            'monthly_trend'   => array_map(fn ($point) => [
                'month'   => $point->month,
                'revenue' => $point->revenue,
                'cost'    => $point->cost,
            ], $this->monthlyTrend),
            'recent_sales_bills'    => AccCustomerTransactionResource::collection($this->recentSalesBills),
            'recent_purchase_bills' => AccVendorTransactionResource::collection($this->recentPurchaseBills),
            'low_stock_products'    => ProductLiteResource::collection($this->lowStockProducts),
            'top_products' => $this->topProducts->map(fn ($p) => [
                'ulid'       => $p->ulid,
                'name'       => $p->name,
                'sku'        => $p->sku,
                'units_sold' => $p->units_sold,
                'revenue'    => $p->revenue,
            ]),
            'top_customers' => $this->topCustomers->map(fn ($c) => [
                'ulid'        => $c->ulid,
                'name'        => $c->name,
                'bill_count'  => $c->bill_count,
                'revenue'     => $c->revenue,
            ]),
            'receivable_aging' => array_map(fn ($b) => ['label' => $b->label, 'amount' => $b->amount], $this->receivableAging),
            'payable_aging'    => array_map(fn ($b) => ['label' => $b->label, 'amount' => $b->amount], $this->payableAging),
        ];
    }
}
