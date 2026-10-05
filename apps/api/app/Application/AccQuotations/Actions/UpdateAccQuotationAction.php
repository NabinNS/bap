<?php

namespace App\Application\AccQuotations\Actions;

use App\Domain\AccQuotations\DTOs\AccQuotationData;
use App\Domain\AccQuotations\Repositories\AccQuotationRepositoryInterface;
use App\Models\AccQuotation;

class UpdateAccQuotationAction
{
    public function __construct(
        private AccQuotationRepositoryInterface $quotations,
    ) {}

    /** Header-fields-only edit (date/voucher_no) — never touches items or totals. */
    public function execute(AccQuotation $quotation, AccQuotationData $data): AccQuotation
    {
        return $this->quotations->update($quotation, $data);
    }
}
