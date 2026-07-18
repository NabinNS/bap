<?php

namespace App\Application\Offers\Actions;

use App\Domain\Offers\DTOs\OfferData;
use App\Domain\Offers\Repositories\OfferRepositoryInterface;
use App\Models\Offer;

class UpdateOfferAction
{
    public function __construct(
        private OfferRepositoryInterface $offers,
    ) {}

    public function execute(Offer $offer, OfferData $data): Offer
    {
        return $this->offers->update($offer, $data);
    }
}
