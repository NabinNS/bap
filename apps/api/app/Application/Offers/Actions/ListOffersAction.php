<?php

namespace App\Application\Offers\Actions;

use App\Domain\Offers\DTOs\OfferFilterData;
use App\Domain\Offers\Repositories\OfferRepositoryInterface;
use Illuminate\Pagination\LengthAwarePaginator;

class ListOffersAction
{
    public function __construct(
        private OfferRepositoryInterface $offers,
    ) {}

    public function execute(int $tenantId, int $perPage = 15, OfferFilterData $filters = new OfferFilterData()): LengthAwarePaginator
    {
        return $this->offers->paginate($tenantId, $perPage, $filters);
    }
}
