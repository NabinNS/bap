<?php

namespace App\Infrastructure\Repositories\Offers;

use App\Domain\Offers\DTOs\OfferData;
use App\Domain\Offers\DTOs\OfferFilterData;
use App\Domain\Offers\Repositories\OfferRepositoryInterface;
use App\Models\Offer;
use Illuminate\Pagination\LengthAwarePaginator;

class EloquentOfferRepository implements OfferRepositoryInterface
{
    public function paginate(int $tenantId, int $perPage, OfferFilterData $filters): LengthAwarePaginator
    {
        return Offer::where('tenant_id', $tenantId)
            ->with('imageGroups.imageItems')
            ->when($filters->search, fn($q, $v) => $q->where('title', 'like', "%$v%"))
            ->when($filters->isActive !== null, fn($q) => $q->where('is_active', $filters->isActive))
            ->orderBy($filters->sortBy, $filters->sortDir)
            ->paginate($perPage);
    }

    public function findByUlid(int $tenantId, string $ulid): Offer
    {
        return Offer::where('tenant_id', $tenantId)
            ->where('ulid', $ulid)
            ->firstOrFail();
    }

    public function create(int $tenantId, OfferData $data): Offer
    {
        return Offer::create([
            'tenant_id'  => $tenantId,
            'title'      => $data->title,
            'sub_title'  => $data->subTitle,
            'is_active'  => $data->isActive,
            'sort_order' => $data->sortOrder,
        ]);
    }

    public function update(Offer $offer, OfferData $data): Offer
    {
        $offer->update([
            'title'      => $data->title,
            'sub_title'  => $data->subTitle,
            'is_active'  => $data->isActive,
            'sort_order' => $data->sortOrder,
        ]);

        return $offer->fresh();
    }

    public function delete(Offer $offer): void
    {
        $offer->delete();
    }
}
