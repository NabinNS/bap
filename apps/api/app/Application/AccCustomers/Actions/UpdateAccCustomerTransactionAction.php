<?php

namespace App\Application\AccCustomers\Actions;

use App\Domain\AccCustomers\DTOs\AccCustomerTransactionData;
use App\Domain\AccCustomers\Repositories\AccCustomerTransactionRepositoryInterface;
use App\Models\AccCustomer;
use App\Models\AccCustomerTransaction;
use Illuminate\Support\Facades\DB;

class UpdateAccCustomerTransactionAction
{
    public function __construct(
        private AccCustomerTransactionRepositoryInterface $transactions,
        private RecalculateCustomerBalanceAction $recalculateBalance,
    ) {}

    /**
     * Header-fields-only edit. For an itemized transaction, debit/credit are derived from its
     * items' totals (see RecalculateAccCustomerTransactionTotalsAction) — the incoming debit/credit
     * are ignored there so this can't desync the bill from its items.
     */
    public function execute(AccCustomer $customer, AccCustomerTransaction $transaction, AccCustomerTransactionData $data): AccCustomerTransaction
    {
        return DB::transaction(function () use ($customer, $transaction, $data) {
            $hasItems = $this->transactions->hasItems($transaction);

            $updated = $this->transactions->update($transaction, new AccCustomerTransactionData(
                date:            $data->date,
                particular:      $data->particular,
                voucherNo:       $data->voucherNo,
                chequeNo:        $data->chequeNo,
                debit:           $hasItems ? $transaction->debit : $data->debit,
                credit:          $hasItems ? $transaction->credit : $data->credit,
                discountPercent: null,
                items:           [],
            ));

            $this->recalculateBalance->execute($customer, $updated->fiscal_year_id);

            return $updated;
        });
    }
}
