<?php

namespace App\Application\AccQuotations\Actions;

use App\Domain\AccQuotations\Repositories\AccQuotationRepositoryInterface;
use App\Models\AccCustomer;
use Illuminate\Support\Collection;

class ListTrashedAccQuotationsAction
{
    public function __construct(
        private AccQuotationRepositoryInterface $quotations,
    ) {}

    public function execute(AccCustomer $customer, ?int $fiscalYearId = null): Collection
    {
        return $this->quotations->trashed($customer, $fiscalYearId);
    }
}
