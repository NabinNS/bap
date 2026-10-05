<?php

namespace App\Application\AccQuotations\Actions;

use App\Domain\AccQuotations\Repositories\AccQuotationRepositoryInterface;
use Illuminate\Pagination\LengthAwarePaginator;

class ListAllQuotationsAction
{
    public function __construct(
        private AccQuotationRepositoryInterface $quotations,
    ) {}

    public function execute(int $tenantId, int $perPage = 50, ?int $fiscalYearId = null): LengthAwarePaginator
    {
        return $this->quotations->paginateAll($tenantId, $perPage, $fiscalYearId);
    }
}
