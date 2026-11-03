<?php

namespace App\Application\ActivityLogs\Actions;

use App\Domain\ActivityLogs\Repositories\ActivityLogRepositoryInterface;
use Illuminate\Pagination\LengthAwarePaginator;

class ListActivityLogsAction
{
    public function __construct(private ActivityLogRepositoryInterface $activityLogs) {}

    public function execute(string $subjectType, string $subjectUlid, int $tenantId): LengthAwarePaginator
    {
        $subjectId = $this->activityLogs->resolveSubjectId($subjectType, $subjectUlid, $tenantId);

        return $this->activityLogs->listForSubject($subjectType, $subjectId, $tenantId);
    }
}
