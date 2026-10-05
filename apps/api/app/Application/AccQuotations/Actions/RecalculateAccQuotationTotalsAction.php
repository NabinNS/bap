<?php

namespace App\Application\AccQuotations\Actions;

use App\Domain\AccQuotations\DTOs\AccQuotationTotalsData;
use App\Domain\AccQuotations\Repositories\AccQuotationRepositoryInterface;
use App\Models\AccQuotation;
use Illuminate\Support\Facades\DB;

class RecalculateAccQuotationTotalsAction
{
    private const VAT_RATE = 0.13;

    public function __construct(
        private AccQuotationRepositoryInterface $quotations,
    ) {}

    /**
     * Recompute the quotation's discount/VAT breakdown from its line items and either a newly
     * set discount percent OR discount amount (whichever the caller just edited), then persist it.
     *
     * Idempotent: always derives from the current sum of item amounts, so it's safe to call
     * again after adding more items or changing the discount.
     */
    public function execute(AccQuotation $quotation, ?int $discountPercent = null, ?int $discountAmount = null): AccQuotation
    {
        return DB::transaction(function () use ($quotation, $discountPercent, $discountAmount) {
            $quotation = $this->quotations->lockForRecalculation($quotation);

            // Each line's amount net of its own per-row discount.
            $subtotal = $this->quotations->itemsTotal($quotation);

            if ($discountAmount !== null) {
                // Amount is the source of truth here — percent is derived for display only,
                // avoiding the rounding drift that would come from recomputing amount from percent.
                $discountAmount  = max(0, min($subtotal, $discountAmount));
                $discountPercent = $subtotal > 0 ? (int) round($discountAmount / $subtotal * 100) : 0;
            } else {
                $discountPercent ??= $quotation->discount_percent ?? 0;
                $discountAmount = (int) round($subtotal * $discountPercent / 100);
            }

            $taxableAmount = $subtotal - $discountAmount;
            $vatAmount     = (int) round($taxableAmount * self::VAT_RATE);
            $grandTotal    = $taxableAmount + $vatAmount;

            return $this->quotations->updateTotals($quotation, new AccQuotationTotalsData(
                discountPercent: $discountPercent,
                discountAmount:  $discountAmount,
                taxableAmount:   $taxableAmount,
                vatAmount:       $vatAmount,
                grandTotal:      $grandTotal,
            ));
        });
    }
}
