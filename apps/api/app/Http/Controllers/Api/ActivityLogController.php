<?php

namespace App\Http\Controllers\Api;

use App\Application\ActivityLogs\Actions\ListActivityLogsAction;
use App\Http\Requests\ActivityLogs\ListActivityLogsRequest;
use App\Http\Resources\ActivityLogs\ActivityLogResource;
use App\Http\Controllers\Controller;
use App\Http\Resources\ApiResponse;
use Illuminate\Http\JsonResponse;

class ActivityLogController extends Controller
{
    public function index(ListActivityLogsRequest $request, ListActivityLogsAction $action): JsonResponse
    {
        $v    = $request->validated();
        $logs = $action->execute($v['subject_type'], $v['subject_ulid'], $request->user()->currentTenantId());

        return ApiResponse::paginated($logs, ActivityLogResource::class, 'Activity logs retrieved');
    }
}
