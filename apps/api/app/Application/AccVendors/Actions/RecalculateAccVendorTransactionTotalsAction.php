<?php

namespace App\Application\AccVendors\Actions;

use App\Models\AccVendorTransaction;

class RecalculateAccVendorTransactionTotalsAction
{
    private const VAT_RATE = 0.13;

    /**
     * Recompute the bill's discount/VAT breakdown from its line items and (optionally newly
     * set) discount percent, then persist it — debit ends up holding the final grand total.
     *
     * Idempotent: always derives from the current sum of item amounts, so it's safe to call
     * again after adding more items or changing the discount percent.
     */
    public function execute(AccVendorTransaction $transaction, ?int $discountPercent = null): AccVendorTransaction
    {
        $discountPercent ??= $transaction->discount_percent ?? 0;

        // sum('total') — each line's amount net of its own per-row discount.
        $subtotal = (int) $transaction->items()->sum('total');

        $taxableAmount = $subtotal - (int) round($subtotal * $discountPercent / 100);
        $vatAmount     = (int) round($taxableAmount * self::VAT_RATE);
        $grandTotal    = $taxableAmount + $vatAmount;

        $transaction->update([
            'discount_percent' => $discountPercent,
            'taxable_amount'   => $taxableAmount,
            'vat_amount'       => $vatAmount,
            'grand_total'      => $grandTotal,
            // Kept in sync with grand_total so the vendor's ledger balance reflects the real amount owed.
            'debit'            => $grandTotal,
        ]);

        return $transaction->fresh();
    }
}
