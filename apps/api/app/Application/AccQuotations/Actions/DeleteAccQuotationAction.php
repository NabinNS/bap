<?php

namespace App\Application\AccQuotations\Actions;

use App\Domain\AccQuotations\Repositories\AccQuotationRepositoryInterface;
use App\Models\AccQuotation;

class DeleteAccQuotationAction
{
    public function __construct(
        private AccQuotationRepositoryInterface $quotations,
    ) {}

    public function execute(AccQuotation $quotation): void
    {
        $this->quotations->delete($quotation);
    }
}
