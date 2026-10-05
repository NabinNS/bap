<?php

namespace App\Application\AccQuotations\Actions;

use App\Domain\AccQuotations\Repositories\AccQuotationRepositoryInterface;
use App\Models\AccQuotation;
use Illuminate\Support\Collection;

class ListTrashedAccQuotationItemsAction
{
    public function __construct(
        private AccQuotationRepositoryInterface $quotations,
    ) {}

    public function execute(AccQuotation $quotation): Collection
    {
        return $this->quotations->trashedItems($quotation);
    }
}
