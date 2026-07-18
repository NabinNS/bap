<?php

namespace App\Application\Offers\Actions;

use App\Domain\Offers\DTOs\OfferData;
use App\Domain\Offers\Repositories\OfferRepositoryInterface;
use App\Models\Offer;

class CreateOfferAction
{
    public function __construct(
        private OfferRepositoryInterface $offers,
    ) {}

    public function execute(int $tenantId, OfferData $data): Offer
    {
        return $this->offers->create($tenantId, $data);
    }
}
