<?php

namespace App\Domain\ActivityLogs\Repositories;

use Illuminate\Pagination\LengthAwarePaginator;

interface ActivityLogRepositoryInterface
{
    public function resolveSubjectId(string $subjectType, string $subjectUlid, int $tenantId): int;

    public function listForSubject(string $subjectType, int $subjectId, int $tenantId): LengthAwarePaginator;
}
