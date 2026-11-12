<?php

namespace App\Observers;

use App\Models\AccCustomer;
use App\Models\AccVendor;
use App\Models\ActivityLog;
use App\Models\FiscalYear;
use App\Models\Product;
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
 *
 * A request can also carry a `X-Activity-Session` header — a client-generated id scoped to
 * one continuous editing session (e.g. a transaction detail panel left open while the user
 * tabs through several fields, each one genuinely autosaving, not a draft). All writes
 * sharing that session id for the same subject merge into a single log row instead of
 * producing one row per field blur, so the session's net before/after is what gets recorded.
 */
class ActivityLogObserver
{
    public function created(Model $model): void
    {
        // attributesToArray() (not getAttributes()) applies the model's casts, so a JSON
        // column like bill_details comes back as a real PHP array instead of its raw,
        // still-encoded string form.
        $this->log($model, 'created', $model->attributesToArray());
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
            $this->log($model, 'created', $model->attributesToArray());

            return;
        }

        $diff = [];
        foreach ($changes as $field => $rawNew) {
            $rawOld = $model->getOriginal($field);

            // A JSON/array column (e.g. bill_details holding discount/VAT/grand-total) is
            // diffed key-by-key instead of as one blob, so "vat_amount changed from 0 to 274"
            // shows up the same as any other field, not a raw JSON dump. getChanges()/
            // getOriginal() return the raw, still-encoded string for these — decode explicitly.
            $newArr = $this->decodeArrayAttribute($model, $field, $rawNew);
            $oldArr = $this->decodeArrayAttribute($model, $field, $rawOld);
            if ($newArr !== null || $oldArr !== null) {
                foreach ($this->diffArrayField($oldArr ?? [], $newArr ?? []) as $subField => $pair) {
                    $diff[$subField] = $pair;
                }
                continue;
            }

            // A known foreign key (customer_id, vendor_id, fiscal_year_id, product_id) is
            // resolved to its display name *here*, before it's stored — not just in the
            // separate describeChanges() text. The UI's change-chip list renders straight
            // from this stored diff, so without this it would show "fiscal_year_id: 11 → 12"
            // instead of "fiscal year: 2082/83 → 2083/84".
            if (str_ends_with($field, '_id') && isset(self::FK_LOOKUPS[$field])) {
                $diff[$this->fkLabel($field)] = [
                    'old' => $this->resolveForeignKeyName($field, $rawOld) ?? 'None',
                    'new' => $this->resolveForeignKeyName($field, $rawNew) ?? 'None',
                ];
                continue;
            }

            $diff[$field] = ['old' => $this->formatValue($rawOld), 'new' => $this->formatValue($rawNew)];
        }

        $this->log($model, 'updated', $diff, $this->describeChanges($diff));
    }

    public function deleted(Model $model): void
    {
        $attributes = $model->attributesToArray();
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

        $sessionId = $this->sessionId();

        if ($sessionId && $event !== 'deleted') {
            $recent = ActivityLog::where('tenant_id', $model->tenant_id)
                ->where('subject_type', $model->getMorphClass())
                ->where('subject_id', $model->getKey())
                ->where('session_id', $sessionId)
                ->latest()
                ->first();

            if ($recent) {
                $this->mergeIntoRecent($recent, $changes, $actor, $label);

                return;
            }
        }

        $subjectType = $model->getMorphClass();

        $description = match ($event) {
            'created' => $this->createdDescription($actor, $label, $subjectType, $changes),
            'updated' => "{$actor} updated {$label} — {$detail}",
            'deleted' => $this->deletedDescription($actor, $label, $subjectType, $changes) ?? "{$actor} deleted {$label} — {$detail}",
            default   => "{$actor} {$event} {$label}",
        };

        [$ownerType, $ownerId] = $this->ownerFor($model, $subjectType);

        ActivityLog::create([
            'tenant_id'    => $model->tenant_id,
            'user_id'      => Auth::id(),
            'subject_type' => $model->getMorphClass(),
            'subject_id'   => $model->getKey(),
            'owner_type'   => $ownerType,
            'owner_id'     => $ownerId,
            'label'        => $label,
            'event'        => $event,
            'description'  => $description,
            'changes'      => $changes,
            'session_id'   => $sessionId,
        ]);
    }

    /** The vendor/customer/product this row should surface under in an aggregated activity
     *  panel — itself for an account/product row, or the owning FK for one of its
     *  transactions/items. Read directly off the model's current attributes (not $changes),
     *  since an update to e.g. an item's quantity won't include its unchanged product_id in
     *  the diff. Returns [null, null] for subject types that aren't aggregated this way. */
    private function ownerFor(Model $model, string $subjectType): array
    {
        return match ($subjectType) {
            'acc_vendor', 'acc_customer', 'product' => [$subjectType, $model->getKey()],
            'acc_vendor_transaction', 'acc_vendor_transaction_item' => ['acc_vendor', $model->vendor_id],
            'acc_customer_transaction', 'acc_customer_transaction_item' => ['acc_customer', $model->customer_id],
            'product_transaction_item' => ['product', $model->product_id],
            default => [null, null],
        };
    }

    private function sessionId(): ?string
    {
        return RequestFacade::header('X-Activity-Session');
    }

    /** $changes here is always diff-format (field => ['old' => ..., 'new' => ...]) — the
     *  model can only be truly created once, so anything merging into an existing row within
     *  a session is a follow-up 'updated' event. */
    private function mergeIntoRecent(ActivityLog $recent, array $changes, string $actor, string $label): void
    {
        $recent->label = $label;

        if ($recent->event === 'created') {
            $snapshot = $recent->changes ?? [];
            foreach ($changes as $field => $pair) {
                $snapshot[$field] = $pair['new'];
            }

            $recent->changes = $snapshot;
            $recent->description = $this->createdDescription($actor, $label, $recent->subject_type, $snapshot);
        } else {
            $diff = $recent->changes ?? [];
            foreach ($changes as $field => $pair) {
                $diff[$field] = ['old' => $diff[$field]['old'] ?? $pair['old'], 'new' => $pair['new']];
            }
            $diff = array_filter($diff, fn ($pair) => $pair['old'] !== $pair['new']);

            if (empty($diff)) {
                return;
            }

            $recent->changes = $diff;
            $recent->description = "{$actor} updated {$label} — ".$this->describeChanges($diff);
        }

        $recent->save();
    }

    /** Known foreign-key columns, mapped to [Model class, display attribute] — lets a raw id
     *  like fiscal_year_id: 11 render as "fiscal year: 2083/84" instead of the bare number. */
    private const FK_LOOKUPS = [
        'vendor_id'      => [AccVendor::class, 'name'],
        'customer_id'    => [AccCustomer::class, 'name'],
        'fiscal_year_id' => [FiscalYear::class, 'name'],
        'product_id'     => [Product::class, 'name'],
    ];

    /** "debit: 1500.00, date: 2026-10-28, fiscal year: 2083/84" — skips null fields (mostly
     *  unset at creation time) and resolves known foreign keys to their actual name; any other
     *  id column (e.g. transaction_id, reference_id — internal linkage, not user-meaningful) is
     *  skipped rather than shown as a bare number. */
    private function describeSnapshot(array $attributes): string
    {
        $parts = [];
        foreach ($attributes as $field => $value) {
            if ($this->isAlwaysSkipped($field) || $value === null) {
                continue;
            }
            if (str_ends_with($field, '_id')) {
                $resolved = $this->resolveForeignKey($field, $value);
                if ($resolved === null) {
                    continue;
                }
                $parts[] = $resolved;
                continue;
            }
            // A JSON/array column (e.g. bill_details) is spelled out key by key instead of
            // dumped as one raw blob.
            if (is_array($value)) {
                foreach ($value as $subField => $subValue) {
                    if ($subValue === null) {
                        continue;
                    }
                    $parts[] = "{$subField}: ".$this->formatValue($subValue);
                }
                continue;
            }
            $parts[] = "{$field}: ".$this->formatValue($value);
        }

        return implode(', ', $parts);
    }

    /** "fiscal year changed from 2082/83 to 2083/84; debit changed from 1000.00 to 1500.00" */
    private function describeChanges(array $diff): string
    {
        $parts = [];
        foreach ($diff as $field => $pair) {
            if ($this->isAlwaysSkipped($field)) {
                continue;
            }
            if (str_ends_with($field, '_id')) {
                $label = $this->fkLabel($field);
                if ($label === null) {
                    continue;
                }
                $old = $this->resolveForeignKeyName($field, $pair['old']) ?? 'none';
                $new = $this->resolveForeignKeyName($field, $pair['new']) ?? 'none';
                $parts[] = "{$label} changed from {$old} to {$new}";
                continue;
            }
            $parts[] = "{$field} changed from ".$this->formatValue($pair['old']).' to '.$this->formatValue($pair['new']);
        }

        return implode('; ', $parts);
    }

    /** Decodes a JSON/array-cast column's raw (still-encoded) value into a PHP array, or null
     *  if this field isn't one of those casts. */
    private function decodeArrayAttribute(Model $model, string $field, mixed $value): ?array
    {
        if (is_array($value)) {
            return $value;
        }
        if (is_string($value) && $model->hasCast($field, ['array', 'json', 'collection', 'object'])) {
            $decoded = json_decode($value, true);

            return is_array($decoded) ? $decoded : null;
        }

        return null;
    }

    /** field => [old, new] for every sub-key that actually differs between two JSON-column
     *  arrays (e.g. bill_details), skipping keys that match. */
    private function diffArrayField(array $old, array $new): array
    {
        $diff = [];
        foreach (array_unique([...array_keys($old), ...array_keys($new)]) as $key) {
            $oldVal = $old[$key] ?? null;
            $newVal = $new[$key] ?? null;
            if ($oldVal === $newVal) {
                continue;
            }
            $diff[$key] = ['old' => $oldVal, 'new' => $newVal];
        }

        return $diff;
    }

    private function isAlwaysSkipped(string $field): bool
    {
        return in_array($field, ['id', 'tenant_id', 'ulid', 'created_at', 'updated_at', 'deleted_at'], true);
    }

    /** Subject types that are a bill/quotation header — logged as a single clean sentence
     *  ("created transaction INV-1023 of 10,000") rather than the full bill_details
     *  breakdown (discount/VAT/etc.), which is noise at creation time. */
    private const AMOUNT_SUBJECTS = ['acc_customer_transaction', 'acc_vendor_transaction', 'acc_quotation'];

    /** Subject types that are a bill/quotation line item — the product name is already in the
     *  label, so the created/deleted line only needs qty/rate/total, not product_id again. */
    private const ITEM_SUBJECTS = ['acc_customer_transaction_item', 'acc_vendor_transaction_item', 'acc_quotation_item'];

    /** Subject types that are a plain account record — the label already says everything
     *  that matters ("created vendor account ABC Traders"); the full address/phone/vat_no
     *  dump at creation time is noise. */
    private const ACCOUNT_SUBJECTS = ['acc_customer', 'acc_vendor'];

    /** Subject types whose label already says everything worth saying ("stock purchase of
     *  Rice 25kg — 2026-11-04 — qty 50") — no extra field dump needed on create/delete. */
    private const LABEL_ONLY_SUBJECTS = ['product_transaction_item'];

    private function createdDescription(string $actor, string $label, string $subjectType, array $data): string
    {
        if (in_array($subjectType, [...self::ACCOUNT_SUBJECTS, ...self::LABEL_ONLY_SUBJECTS], true)) {
            return "{$actor} created {$label}";
        }

        if (in_array($subjectType, self::AMOUNT_SUBJECTS, true)) {
            return "{$actor} created {$label} of ".$this->formatAmount($this->transactionAmount($data));
        }

        if (in_array($subjectType, self::ITEM_SUBJECTS, true)) {
            return "{$actor} created {$label} — ".$this->itemSummary($data);
        }

        return "{$actor} created {$label} — ".$this->describeSnapshot($data);
    }

    private function deletedDescription(string $actor, string $label, string $subjectType, array $data): ?string
    {
        if (in_array($subjectType, [...self::ACCOUNT_SUBJECTS, ...self::LABEL_ONLY_SUBJECTS], true)) {
            return "{$actor} deleted {$label}";
        }

        if (in_array($subjectType, self::AMOUNT_SUBJECTS, true)) {
            return "{$actor} deleted {$label} of ".$this->formatAmount($this->transactionAmount($data));
        }

        if (in_array($subjectType, self::ITEM_SUBJECTS, true)) {
            return "{$actor} deleted {$label} — ".$this->itemSummary($data);
        }

        return null;
    }

    private function itemSummary(array $data): string
    {
        $qty = $this->formatAmount($data['quantity'] ?? null);
        $rate = $this->formatAmount($data['rate'] ?? null);
        $total = $this->formatAmount($data['total'] ?? null);

        return "qty {$qty}, rate {$rate}, total {$total}";
    }

    /** The bill's grand total (if it's an item-based bill with a discount/VAT breakdown),
     *  falling back to whichever of credit/debit is actually set. */
    private function transactionAmount(array $data): mixed
    {
        $grandTotal = $data['bill_details']['grand_total'] ?? null;
        if ($grandTotal !== null) {
            return $grandTotal;
        }

        return ($data['credit'] ?? 0) > 0 ? $data['credit'] : ($data['debit'] ?? 0);
    }

    /** "10,000" rather than "10000.00" — comma-grouped, drops a trailing whole-number decimal
     *  but keeps real cents, matching how amounts are formatted everywhere else in the app. */
    private function formatAmount(mixed $value): string
    {
        if ($value === null || $value === '') {
            return '0';
        }

        if (!is_numeric($value)) {
            return (string) $value;
        }

        $float = (float) $value;
        $decimals = ((float) $value == (int) $float) ? 0 : 2;

        return number_format($float, $decimals);
    }

    /** "fiscal year: 2083/84", or null if this id field isn't in FK_LOOKUPS (internal linkage). */
    private function resolveForeignKey(string $field, mixed $id): ?string
    {
        $label = $this->fkLabel($field);
        if ($label === null) {
            return null;
        }

        $name = $this->resolveForeignKeyName($field, $id);

        return $name !== null ? "{$label}: {$name}" : null;
    }

    /** One request can diff several FK columns across several field saves (e.g. an autosave
     *  session touching fiscal_year_id then customer_id) — memoized per (field, id) so each
     *  distinct foreign row is fetched at most once per request instead of once per old/new
     *  value per field. */
    private static array $fkNameCache = [];

    private function resolveForeignKeyName(string $field, mixed $id): ?string
    {
        if ($id === null || !isset(self::FK_LOOKUPS[$field])) {
            return null;
        }

        $cacheKey = "{$field}:{$id}";
        if (array_key_exists($cacheKey, self::$fkNameCache)) {
            return self::$fkNameCache[$cacheKey];
        }

        [$class, $attribute] = self::FK_LOOKUPS[$field];

        return self::$fkNameCache[$cacheKey] = $class::find($id)?->{$attribute};
    }

    /** "fiscal_year_id" -> "fiscal year" */
    private function fkLabel(string $field): ?string
    {
        return isset(self::FK_LOOKUPS[$field])
            ? str_replace('_', ' ', substr($field, 0, -3))
            : null;
    }

    private function formatValue(mixed $value): string
    {
        if (is_array($value)) {
            return json_encode($value);
        }

        if (is_bool($value)) {
            return $value ? 'Yes' : 'No';
        }

        return $value === null ? 'null' : (string) $value;
    }
}
