<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ApiResponse;
use App\Http\Resources\Settings\FiscalYearResource;
use App\Models\FiscalYear;
use Illuminate\Http\JsonResponse;

class FiscalYearController extends Controller
{
    public function index(): JsonResponse
    {
        $fiscalYears = FiscalYear::orderBy('sort_order')->get();

        return ApiResponse::success(
            FiscalYearResource::collection($fiscalYears),
            'Fiscal years retrieved successfully'
        );
    }
}
