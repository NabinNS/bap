<?php

namespace App\Http\Controllers\Api;

use App\Application\Offers\Actions\CreateOfferAction;
use App\Application\Offers\Actions\DeleteOfferAction;
use App\Application\Offers\Actions\ListOffersAction;
use App\Application\Offers\Actions\UpdateOfferAction;
use App\Domain\Offers\DTOs\OfferFilterData;
use App\Http\Controllers\Controller;
use App\Http\Requests\Offers\StoreOfferRequest;
use App\Http\Requests\Offers\UpdateOfferRequest;
use App\Http\Resources\ApiResponse;
use App\Http\Resources\Offers\OfferResource;
use App\Models\Offer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OfferController extends Controller
{
    public function index(Request $request, ListOffersAction $action): JsonResponse
    {
        return ApiResponse::paginated(
            $action->execute($this->tenantId(), $request->integer('per_page', 15), OfferFilterData::fromRequest($request)),
            OfferResource::class,
            'Offers retrieved successfully'
        );
    }

    public function store(StoreOfferRequest $request, CreateOfferAction $action): JsonResponse
    {
        return ApiResponse::created(
            new OfferResource($action->execute($this->tenantId(), $request->toDTO())),
            'Offer created successfully'
        );
    }

    public function show(Request $request, Offer $offer): JsonResponse
    {
        if ($request->user()) {
            $this->authorize('view', $offer);
        }

        return ApiResponse::success(new OfferResource($offer), 'Offer retrieved successfully');
    }

    public function update(UpdateOfferRequest $request, Offer $offer, UpdateOfferAction $action): JsonResponse
    {
        $this->authorize('update', $offer);

        return ApiResponse::success(
            new OfferResource($action->execute($offer, $request->toDTO())),
            'Offer updated successfully'
        );
    }

    public function destroy(Request $request, Offer $offer, DeleteOfferAction $action): JsonResponse
    {
        $this->authorize('delete', $offer);

        $action->execute($offer);

        return ApiResponse::noContent('Offer deleted successfully');
    }
}
