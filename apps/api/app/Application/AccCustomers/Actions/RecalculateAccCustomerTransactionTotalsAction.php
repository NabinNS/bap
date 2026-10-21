<?php

namespace App\Application\AccCustomers\Actions;

use App\Domain\AccCustomers\DTOs\AccCustomerTransactionTotalsData;
use App\Domain\AccCustomers\Repositories\AccCustomerTransactionRepositoryInterface;
use App\Models\AccCustomer;
use App\Models\AccCustomerTransaction;
use Illuminate\Support\Facades\DB;

class RecalculateAccCustomerTransactionTotalsAction
{
    private const VAT_RATE = 0.13;

    public function __construct(
        private AccCustomerTransactionRepositoryInterface $transactions,
        private RecalculateCustomerBalanceAction $recalculateBalance,
    ) {}

    /**
     * Recompute the bill's discount/VAT breakdown from its line items and either a newly set
     * discount percent OR discount amount (whichever the caller just edited), then persist it —
     * credit ends up holding the final grand total (a sale increases what the customer owes).
     *
     * Idempotent: always derives from the current sum of item amounts, so it's safe to call
     * again after adding more items or changing the discount.
     */
    public function execute(AccCustomer $customer, AccCustomerTransaction $transaction, ?int $discountPercent = null, ?int $discountAmount = null, ?bool $vatExempt = null): AccCustomerTransaction
    {
        return DB::transaction(function () use ($customer, $transaction, $discountPercent, $discountAmount, $vatExempt) {
            $transaction = $this->transactions->lockForRecalculation($transaction);

            // Each line's amount net of its own per-row discount.
            $subtotal = $this->transactions->itemsTotal($transaction);

            if ($discountAmount !== null) {
                // Amount is the source of truth here — percent is derived for display only,
                // avoiding the rounding drift that would come from recomputing amount from percent.
                $discountAmount  = max(0, min($subtotal, $discountAmount));
                $discountPercent = $subtotal > 0 ? (int) round($discountAmount / $subtotal * 100) : 0;
            } else {
                $discountPercent ??= $transaction->discount_percent ?? 0;
                $discountAmount = (int) round($subtotal * $discountPercent / 100);
            }

            $vatExempt ??= $transaction->vat_exempt ?? false;

            $taxableAmount = $subtotal - $discountAmount;
            $vatAmount     = $vatExempt ? 0 : (int) round($taxableAmount * self::VAT_RATE);
            $grandTotal    = $taxableAmount + $vatAmount;

            $updated = $this->transactions->updateTotals($transaction, new AccCustomerTransactionTotalsData(
                discountPercent: $discountPercent,
                discountAmount:  $discountAmount,
                taxableAmount:   $taxableAmount,
                vatAmount:       $vatAmount,
                grandTotal:      $grandTotal,
                vatExempt:       $vatExempt,
            ));

            $this->recalculateBalance->execute($customer, $updated->fiscal_year_id);

            return $updated;
        });
    }
}
