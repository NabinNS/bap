<?php

namespace App\Infrastructure\Repositories\AccCustomers;

use App\Domain\AccCustomers\Repositories\AccCustomerBalanceRepositoryInterface;
use App\Models\AccCustomer;
use App\Models\AccCustomerBalance;

class EloquentAccCustomerBalanceRepository implements AccCustomerBalanceRepositoryInterface
{
    public function upsert(AccCustomer $customer, int $fiscalYearId, float $openingBalance): AccCustomerBalance
    {
        return AccCustomerBalance::updateOrCreate(
            [
                'tenant_id'      => $customer->tenant_id,
                'customer_id'    => $customer->id,
                'fiscal_year_id' => $fiscalYearId,
            ],
            [
                'opening_balance' => $openingBalance,
            ]
        );
    }

    public function allForFiscalYear(int $tenantId, int $fiscalYearId): \Illuminate\Support\Collection
    {
        return AccCustomerBalance::where('tenant_id', $tenantId)
            ->where('fiscal_year_id', $fiscalYearId)
            ->get();
    }

    public function bulkUpsertForFiscalYear(int $tenantId, int $fiscalYearId, array $rows): void
    {
        if (!$rows) {
            return;
        }

        AccCustomerBalance::upsert(
            array_map(fn (array $row) => [
                'tenant_id'         => $tenantId,
                'fiscal_year_id'    => $fiscalYearId,
                'customer_id'       => $row['customer_id'],
                'opening_balance'   => $row['opening_balance'],
                'remaining_balance' => $row['remaining_balance'],
            ], $rows),
            ['tenant_id', 'customer_id', 'fiscal_year_id'],
            ['opening_balance', 'remaining_balance'],
        );
    }

    public function lockForRecalculation(AccCustomer $customer, int $fiscalYearId): AccCustomerBalance
    {
        return AccCustomerBalance::lockForUpdate()->firstOrCreate([
            'tenant_id'      => $customer->tenant_id,
            'customer_id'    => $customer->id,
            'fiscal_year_id' => $fiscalYearId,
        ]);
    }

    public function updateRemainingBalance(AccCustomerBalance $balance, float $remainingBalance): AccCustomerBalance
    {
        $balance->update(['remaining_balance' => $remainingBalance]);

        return $balance;
    }
}
