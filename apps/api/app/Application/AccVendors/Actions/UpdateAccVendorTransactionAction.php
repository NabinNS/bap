<?php

namespace App\Application\AccVendors\Actions;

use App\Domain\AccVendors\DTOs\AccVendorTransactionData;
use App\Domain\AccVendors\Repositories\AccVendorTransactionRepositoryInterface;
use App\Models\AccVendor;
use App\Models\AccVendorTransaction;
use Illuminate\Support\Facades\DB;

class UpdateAccVendorTransactionAction
{
    public function __construct(
        private AccVendorTransactionRepositoryInterface $transactions,
        private RecalculateVendorBalanceAction $recalculateBalance,
    ) {}

    /**
     * Header-fields-only edit. For an itemized transaction, debit/credit are derived from its
     * items' totals (see RecalculateAccVendorTransactionTotalsAction) — the incoming debit/credit
     * are ignored there so this can't desync the bill from its items.
     */
    public function execute(AccVendor $vendor, AccVendorTransaction $transaction, AccVendorTransactionData $data): AccVendorTransaction
    {
        return DB::transaction(function () use ($vendor, $transaction, $data) {
            $hasItems = $this->transactions->hasItems($transaction);

            $updated = $this->transactions->update($transaction, new AccVendorTransactionData(
                date:            $data->date,
                particular:      $data->particular,
                voucherNo:       $data->voucherNo,
                chequeNo:        $data->chequeNo,
                debit:           $hasItems ? $transaction->debit : $data->debit,
                credit:          $hasItems ? $transaction->credit : $data->credit,
                discountPercent: null,
                items:           [],
            ));

            $this->recalculateBalance->execute($vendor, $updated->fiscal_year_id);

            return $updated;
        });
    }
}
