<?php

namespace App\Application\AccCustomers\Actions;

use App\Domain\AccCustomers\DTOs\AccCustomerBalanceData;
use App\Domain\AccCustomers\Repositories\AccCustomerBalanceRepositoryInterface;
use App\Domain\Settings\Repositories\TenantSettingRepositoryInterface;
use App\Models\AccCustomer;
use App\Models\AccCustomerBalance;
use Illuminate\Validation\ValidationException;

class UpsertAccCustomerBalanceAction
{
    public function __construct(
        private AccCustomerBalanceRepositoryInterface $balances,
        private TenantSettingRepositoryInterface $settings,
        private RecalculateCustomerBalanceAction $recalculateBalance,
    ) {}

    public function execute(int $tenantId, AccCustomer $customer, AccCustomerBalanceData $data): AccCustomerBalance
    {
        $fiscalYearId = $data->fiscalYearId ?: $this->settings->getOrCreate($tenantId)->fiscal_year_id;

        if (!$fiscalYearId) {
            throw ValidationException::withMessages([
                'fiscal_year_id' => ['No active fiscal year set. Please configure it in Settings.'],
            ]);
        }

        $balance = $this->balances->upsert($customer, $fiscalYearId, $data->openingBalance);

        $this->recalculateBalance->execute($customer, $fiscalYearId);

        return $balance->fresh();
    }
}
