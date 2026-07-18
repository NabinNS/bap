<?php

namespace App\Domain\Offers\Repositories;

use App\Domain\Offers\DTOs\OfferData;
use App\Domain\Offers\DTOs\OfferFilterData;
use App\Models\Offer;
use Illuminate\Pagination\LengthAwarePaginator;

interface OfferRepositoryInterface
{
    public function paginate(int $tenantId, int $perPage, OfferFilterData $filters): LengthAwarePaginator;

    public function findByUlid(int $tenantId, string $ulid): Offer;

    public function create(int $tenantId, OfferData $data): Offer;

    public function update(Offer $offer, OfferData $data): Offer;

    public function delete(Offer $offer): void;
}
