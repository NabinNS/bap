<?php

namespace App\Application\AccQuotations\Actions;

use App\Domain\AccQuotations\Repositories\AccQuotationRepositoryInterface;
use App\Models\AccCustomer;
use Illuminate\Pagination\LengthAwarePaginator;

class ListAccQuotationsAction
{
    public function __construct(
        private AccQuotationRepositoryInterface $quotations,
    ) {}

    public function execute(AccCustomer $customer, int $perPage = 50, ?int $fiscalYearId = null): LengthAwarePaginator
    {
        return $this->quotations->paginate($customer, $perPage, $fiscalYearId);
    }
}
