<?php

namespace App\Http\Controllers\Api;

use App\Application\AccVendors\Actions\UpsertAccVendorOpeningBalanceAction;
use App\Http\Controllers\Controller;
use App\Http\Resources\ApiResponse;
use App\Models\AccVendor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AccVendorOpeningBalanceController extends Controller
{
    public function upsert(Request $request, AccVendor $accVendor, UpsertAccVendorOpeningBalanceAction $action): JsonResponse
    {
        $this->authorize('update', $accVendor);

        $validated = $request->validate([
            'opening_balance' => ['required', 'numeric', 'min:0'],
        ]);

        $balance = $action->execute($this->tenantId(), $accVendor, (float) $validated['opening_balance']);

        return ApiResponse::success([
            'vendor_id'       => $accVendor->ulid,
            'fiscal_year_id'  => $balance->fiscal_year_id,
            'opening_balance' => $balance->opening_balance,
        ], 'Opening balance saved successfully');
    }
}
