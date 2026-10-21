<?php

namespace App\Http\Controllers\Api;

use App\Application\Dashboard\Actions\GetDashboardSummaryAction;
use App\Http\Controllers\Controller;
use App\Http\Resources\ApiResponse;
use App\Http\Resources\Dashboard\DashboardSummaryResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function summary(Request $request, GetDashboardSummaryAction $action): JsonResponse
    {
        return ApiResponse::success(
            new DashboardSummaryResource($action->execute(
                $this->tenantId(),
                $request->integer('fiscal_year_id') ?: null,
                $request->string('from')->value() ?: null,
                $request->string('to')->value() ?: null,
                $request->string('today_bs')->value() ?: null,
            )),
            'Dashboard summary retrieved successfully'
        );
    }
}
