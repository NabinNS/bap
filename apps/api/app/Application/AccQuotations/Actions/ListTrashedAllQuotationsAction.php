<?php

namespace App\Application\AccQuotations\Actions;

use App\Domain\AccQuotations\Repositories\AccQuotationRepositoryInterface;
use App\Models\AccQuotation;
use Illuminate\Support\Collection;

class ListTrashedAllQuotationsAction
{
    public function __construct(
        private AccQuotationRepositoryInterface $quotations,
    ) {}

    /** @return Collection<int, AccQuotation> */
    public function execute(int $tenantId, ?int $fiscalYearId = null): Collection
    {
        return $this->quotations->trashedAll($tenantId, $fiscalYearId);
    }
}
