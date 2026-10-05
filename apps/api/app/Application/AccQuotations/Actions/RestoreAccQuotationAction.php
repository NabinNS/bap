<?php

namespace App\Application\AccQuotations\Actions;

use App\Domain\AccQuotations\Repositories\AccQuotationRepositoryInterface;
use App\Models\AccQuotation;

class RestoreAccQuotationAction
{
    public function __construct(
        private AccQuotationRepositoryInterface $quotations,
    ) {}

    public function execute(int $tenantId, string $quotationUlid): AccQuotation
    {
        return $this->quotations->restore($tenantId, $quotationUlid);
    }
}
