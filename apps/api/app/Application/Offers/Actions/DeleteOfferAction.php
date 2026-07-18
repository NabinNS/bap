<?php

namespace App\Application\Offers\Actions;

use App\Domain\Offers\Repositories\OfferRepositoryInterface;
use App\Models\Offer;

class DeleteOfferAction
{
    public function __construct(
        private OfferRepositoryInterface $offers,
    ) {}

    public function execute(Offer $offer): void
    {
        $this->offers->delete($offer);
    }
}
