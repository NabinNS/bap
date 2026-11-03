<?php

namespace App\Observers;

use App\Models\ActivityLog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request as RequestFacade;

/**
 * Registered on any transaction-like model (acc customer/vendor transactions, quotations,
 * stock movements) via Model::observe(ActivityLogObserver::class) in AppServiceProvider::boot().
 * On create, logs the full attribute snapshot; on update, logs only the changed fields
 * (old => new); on delete, logs the final snapshot.
 *
 * A request can mark itself a "draft" save (header `X-Activity-Draft: 1`) — e.g. an
 * autosave-on-blur form that persists each field as the user fills it in. Draft saves
 * aren't logged at all; the first non-draft save for a subject is logged as 'created'
 * (full snapshot) regardless of whether it technically hit the created or updated Eloquent
 * event, since that's the moment the record becomes "real" from an audit standpoint. Every
 * non-draft save after that logs as a normal 'updated' diff.
 */
class ActivityLogObserver
{
    public function created(Model $model): void
    {
        $this->log($model, 'created', $model->getAttributes());
    }

    public function updated(Model $model): void
    {
        if ($this->isDraftRequest()) {
            return;
        }

        $changes = $model->getChanges();
        unset($changes['updated_at']);

        $hasExistingLog = $this->hasExistingLog($model);

        if (empty($changes) && $hasExistingLog) {
            return;
        }

        if (!$hasExistingLog) {
            $this->log($model, 'created', $model->getAttributes());

            return;
        }

        $diff = [];
        foreach ($changes as $field => $new) {
            $diff[$field] = ['old' => $model->getOriginal($field), 'new' => $new];
        }

        $this->log($model, 'updated', $diff, $this->describeChanges($diff));
    }

    public function deleted(Model $model): void
    {
        $attributes = $model->getAttributes();
        $this->log($model, 'deleted', $attributes, $this->describeSnapshot($attributes));
    }

    private function isDraftRequest(): bool
    {
        return RequestFacade::header('X-Activity-Draft') !== null;
    }

    private function hasExistingLog(Model $model): bool
    {
        return ActivityLog::where('tenant_id', $model->tenant_id)
            ->where('subject_type', $model->getMorphClass())
            ->where('subject_id', $model->getKey())
            ->exists();
    }

    private function log(Model $model, string $event, array $changes, ?string $detail = null): void
    {
        if ($this->isDraftRequest()) {
            return;
        }

        $actor = Auth::user()?->name ?? 'System';
        $label = method_exists($model, 'activityLogLabel')
            ? $model->activityLogLabel()
            : class_basename($model).' #'.$model->getKey();

        $description = match ($event) {
            'created' => "{$actor} created {$label} — ".$this->describeSnapshot($changes),
            'updated' => "{$actor} updated {$label} — {$detail}",
            'deleted' => "{$actor} deleted {$label} — {$detail}",
            default   => "{$actor} {$event} {$label}",
        };

        ActivityLog::create([
            'tenant_id'    => $model->tenant_id,
            'user_id'      => Auth::id(),
            'subject_type' => $model->getMorphClass(),
            'subject_id'   => $model->getKey(),
            'event'        => $event,
            'description'  => $description,
            'changes'      => $changes,
        ]);
    }

    /** "debit: 1500.00, date: 2026-10-28, particular: Cash sale" */
    private function describeSnapshot(array $attributes): string
    {
        $skip = ['id', 'tenant_id', 'ulid', 'created_at', 'updated_at', 'deleted_at'];

        $parts = [];
        foreach ($attributes as $field => $value) {
            if (in_array($field, $skip, true)) {
                continue;
            }
            $parts[] = "{$field}: ".$this->formatValue($value);
        }

        return implode(', ', $parts);
    }

    /** "debit changed from 1000.00 to 1500.00; date changed from 2026-10-01 to 2026-10-28" */
    private function describeChanges(array $diff): string
    {
        $parts = [];
        foreach ($diff as $field => $pair) {
            $parts[] = "{$field} changed from ".$this->formatValue($pair['old']).' to '.$this->formatValue($pair['new']);
        }

        return implode('; ', $parts);
    }

    private function formatValue(mixed $value): string
    {
        if (is_array($value)) {
            return json_encode($value);
        }

        return $value === null ? 'null' : (string) $value;
    }
}
