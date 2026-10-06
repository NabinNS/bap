# Fiscal Year Balance Rollover — Plan

## Problem

`acc_customer_balances` and `acc_vendor_balances` store one row per
`(tenant, party, fiscal_year)`. Each year's `remaining_balance` is computed
independently:

```
remaining_balance = opening_balance + SUM(credit) - SUM(debit)   -- scoped to that fiscal year
```

`opening_balance` for a given year is currently always a manually entered
value — it is never derived from the previous year's `remaining_balance`.
There is no rollover/carry-forward logic anywhere in the codebase today.

This causes two related problems:

1. **No continuity**: switching to a new fiscal year starts every
   customer/vendor at opening_balance = 0 (or whatever was typed in),
   disconnected from what they actually owed/were owed at the end of the
   prior year.
2. **Retroactive drift**: even if rollover is done once, if someone later
   edits/adds/deletes a transaction in a *past* fiscal year, nothing
   recalculates forward — every later year's opening_balance becomes stale
   relative to the (now-changed) prior year's closing balance.

## Goal

When the tenant's active fiscal year is changed (in Settings) to a later
year, automatically carry forward each customer's and vendor's
`remaining_balance` from the prior fiscal year into the new year's
`opening_balance`. Also provide a safe way to re-sync when past-year data
changes after the fact, and prevent silent drift where possible.

---

## Design

### 1. Data model changes

Add to `acc_customer_balances` and `acc_vendor_balances`:

- `rolled_forward_at` (nullable timestamp) — set when this row's
  `opening_balance` was populated by an automatic rollover, cleared if the
  opening_balance is subsequently edited manually. Lets us distinguish
  "auto-carried" vs "manually set" opening balances.
- `source_balance_id` (nullable FK to the prior year's balance row, same
  table) — traceability: which row this opening_balance was carried from.

Add to `fiscal_years`:

- `closed_at` (nullable timestamp) — marks a fiscal year as closed for
  editing (see Edge Case 5). Not required for v1 but strongly recommended;
  can be deferred to a follow-up if we want to ship rollover alone first.

### 2. New action: `RolloverFiscalYearBalancesAction`

One action, parameterized by entity type, or two mirrored actions
(`RolloverCustomerBalancesAction` / `RolloverVendorBalancesAction`) to match
the existing Customer/Vendor code duplication pattern in this codebase.

```
execute(tenantId, fromFiscalYearId, toFiscalYearId):
    DB::transaction:
        for each AccVendorBalance row where tenant_id = tenantId AND fiscal_year_id = fromFiscalYearId:
            vendor = row.vendor
            existing = AccVendorBalance::lockForUpdate()
                           ->firstOrNew([tenant_id, vendor.id, toFiscalYearId])

            if existing.exists AND existing.rolled_forward_at IS NULL AND existing.opening_balance != 0:
                # a human already set this year's opening balance manually — do not clobber
                skip (record in a report: "skipped vendor X — manual opening balance already set")
                continue

            existing.opening_balance = row.remaining_balance
            existing.rolled_forward_at = now()
            existing.source_balance_id = row.id
            existing.save()

            RecalculateVendorBalanceAction::execute(vendor, toFiscalYearId)
    return RolloverReport { carried: [...], skipped: [...] }
```

Mirror for customers. Both run inside the same outer transaction when
triggered together from the settings change.

### 3. Determining "previous fiscal year"

`fiscal_years` has no dates, only `sort_order`. Rollover must use:

```
fromFiscalYearId = fiscal year with the highest sort_order that is < toFiscalYearId.sort_order
```

Do **not** assume "previous" means "whatever was the tenant's active year
before this change" — a tenant could jump across multiple fiscal years, or
set one up out of order. Always resolve "previous" via `sort_order` at
rollover time.

### 4. Trigger point

Hook into the settings action that updates `tenant_settings.fiscal_year_id`
(`apps/api/app/Application/Settings/...`). When the new value's
`sort_order` is greater than the current value's `sort_order`:

1. Resolve `fromFiscalYearId` via sort_order (step 3).
2. Run `RolloverCustomerBalancesAction` and `RolloverVendorBalancesAction`.
3. Update `tenant_settings.fiscal_year_id`.
4. Return the rollover report (counts carried/skipped) to the frontend so
   the user gets a confirmation summary, not a silent background change.

If the new value's `sort_order` is **lower or equal** (switching back to an
earlier/same year, e.g. to view historical data), do **not** run rollover —
just change the active year pointer.

### 5. Manual re-sync endpoint (for retroactive edits)

Expose a per-vendor and per-customer action, e.g.
`ResyncOpeningBalanceAction(partyId, fiscalYearId)`, that re-runs the same
carry-forward logic for a single party/year pair:

- Usable from the vendor/customer detail page ("opening balance looks
  wrong? resync from previous year").
- Also auto-triggered as an opt-in side effect inside
  `RecalculateVendorBalanceAction`/`RecalculateCustomerBalanceAction`: if
  this party's balance row for `fiscalYearId + 1` exists AND has
  `rolled_forward_at IS NOT NULL` (i.e. it was never manually overridden),
  cascade the recalculation forward one year. Chain forward recursively
  until hitting a year with no later year, or one whose opening_balance was
  manually set (`rolled_forward_at IS NULL`).
  - Guard against runaway recursion: cap at number of fiscal years that
    exist for the tenant (small, bounded) and cycle-detect via sort_order
    strictly increasing.

### 6. Reporting / visibility

Return a structured result from rollover (and from cascade resync) listing:
- vendors/customers carried forward, with old → new opening_balance
- vendors/customers skipped because a manual opening_balance already existed
- any vendors/customers that exist in the new year but had no row in the
  old year (new party — nothing to carry, opening_balance stays as entered/0)

Surface this as a toast/summary in the frontend after changing fiscal year
in Settings, not just a silent success.

---

## Edge Cases

1. **No prior fiscal year exists** (tenant's very first fiscal year, or
   switching to the lowest sort_order year). Rollover is a no-op — nothing
   to carry forward. Just proceed with whatever opening_balance exists
   (default 0).

2. **New fiscal year already has manually-entered opening balances.**
   Must not silently overwrite. Use the `rolled_forward_at` flag: only
   auto-carry into rows that are brand new or were themselves previously
   auto-carried (never touch a row a human explicitly edited). See step 2's
   skip logic.

3. **New fiscal year already has transactions posted against it** (user
   back-entered some current-year transactions before switching the active
   year, or fiscal year was pre-selected on a transaction). Rollover must
   call the recalculate action after setting opening_balance, not just set
   the column, so `remaining_balance = new opening_balance + existing
   net(credit-debit)` is correct, not just `= new opening_balance`.

4. **Vendor/customer exists only in the old year, not referenced at all in
   the new year yet** (first transaction for them hasn't happened in the
   new year). Still create the new year's balance row via rollover so the
   carried opening_balance is available when their first new-year
   transaction posts and triggers `lockForRecalculation`'s `firstOrCreate` —
   otherwise that firstOrCreate would default opening_balance to 0 and lose
   the carry-forward.

5. **Retroactive edit to a past (already rolled-forward) fiscal year's
   transaction.** This is the original core concern. Two complementary
   mitigations:
   - **Soft protection**: cascade resync (section 5) automatically repairs
     any auto-carried later years when an earlier year's balance is
     recalculated.
   - **Hard protection (recommended, optional for v1)**: a "closed fiscal
     year" flag (`fiscal_years.closed_at`). Once a year is closed (e.g.
     explicitly by the user after rollover, or automatically N days after
     rollover), block new/edited/deleted transactions against it at the
     action layer (`StoreAccVendorTransactionAction` etc. should check
     `fiscalYear.closed_at` and throw a validation error, with an explicit
     "reopen fiscal year" admin action required to override). This prevents
     the drift from happening at all, rather than only repairing it after
     the fact.

6. **Multiple fiscal years skipped at once** (tenant jumps from year 1
   directly to year 3, year 2 never having been active). "Previous fiscal
   year" per section 3 is still just the immediate sort_order predecessor
   (year 2), even if it was never the tenant's *active* year — carry
   forward from year 2's remaining_balance (which may itself be all zeros
   if nothing was ever posted to it). This is correct: it reflects the true
   running balance chain, not just "active" years.

7. **Tenant switches fiscal year backward then forward again**
   (e.g. active=3 → set active=1 to review history → set active=3 again).
   Second switch to 3 must not re-run rollover from 1→3 incorrectly, and
   must not double-apply if year 3's balances were already rolled forward
   earlier and have since accumulated their own transactions. Resolution:
   rollover is idempotent per the skip rule in step 2 — once year 3's row
   has `rolled_forward_at` set and has since been recalculated, re-running
   rollover will recompute `opening_balance = (current) year 2
   remaining_balance` again. This is actually desired if year 2 changed in
   the meantime (self-healing), but could stomp on year 3 activity that
   happened in between if opening_balance is blindly reset. **Fix**: only
   reset `opening_balance` on rollover if it still equals the value it was
   last carried as (compare against `source_balance_id`'s current
   `remaining_balance`) — i.e. treat rollover as "ensure in sync," not
   "blindly re-stamp." Equivalently: rollover should be safe to call
   repeatedly and should only change state when the source has drifted,
   which is exactly the cascade-resync behavior from section 5. In
   practice, trigger rollover via the cascade-resync action, not
   independent logic, so both paths share one implementation.

8. **Deleting a customer/vendor** that has balance rows in multiple fiscal
   years. Existing `cascadeOnDelete()` on the balance/transaction FKs
   already handles cleanup — no new behavior needed, but confirm
   soft-deleted parties are excluded from rollover's "for each balance row"
   loop (filter `whereHas('customer')`/`whereHas('vendor')` to exclude
   trashed, unless the business wants historical balances preserved for
   trashed parties too — recommend excluding trashed from *new* rollover
   targets but not deleting their historical rows).

9. **Concurrent fiscal year switch** (two admins change settings at the
   same time, or a transaction is being posted to the old year at the exact
   moment of rollover). Use the same `lockForUpdate()` pattern as existing
   recalculation actions, and wrap the entire rollover (all
   parties) in one `DB::transaction`, so it's atomic with the
   `tenant_settings.fiscal_year_id` update — either the whole switch +
   rollover succeeds or none of it does.

10. **Large tenant with thousands of vendors/customers.** Rollover loops
    over every balance row — must run as a queued job if the tenant is
    large, rather than synchronously in the settings-update request, to
    avoid request timeouts. Recommend: dispatch a queued job
    (`RolloverFiscalYearBalancesJob`) from the settings action, update
    `tenant_settings.fiscal_year_id` immediately (year switch itself is
    instant), and let rollover complete asynchronously with a
    notification/flag when done. Frontend should show "balances are being
    carried forward" state until the job completes for that fiscal year
    (e.g. a `tenant_settings.meta.rollover_status` flag).

11. **opening_balance edited manually to exactly 0 on purpose** (legitimate
    case, not "never touched"). The skip condition in step 2
    (`opening_balance != 0`) is too naive — a manual 0 would incorrectly be
    treated as "untouched" and get overwritten. **Fix**: rely solely on
    `rolled_forward_at IS NULL` to mean "manually set" (set it on every
    manual edit via the Upsert action, regardless of value), not on the
    opening_balance value itself. `UpsertAccCustomerBalanceAction`/
    `UpsertAccVendorBalanceAction` must clear `rolled_forward_at` (set to
    null) whenever a human explicitly sets opening_balance through that
    action/endpoint.

12. **Fiscal year's `remaining_balance` carried is negative** (party is in
    a net-debit position). Carrying a negative opening_balance forward is
    correct and expected (it's not a UI/validation error) — ensure no
    validation rule rejects negative opening_balance values.

---

## Implementation Checklist

- [ ] Migration: add `rolled_forward_at`, `source_balance_id` to
      `acc_customer_balances` and `acc_vendor_balances`.
- [ ] Migration (optional, recommended): add `closed_at` to `fiscal_years`.
- [ ] Update `UpsertAccCustomerBalanceAction` / `UpsertAccVendorBalanceAction`
      to clear `rolled_forward_at` on manual opening_balance edits.
- [ ] New action: `ResyncCustomerOpeningBalanceAction` /
      `ResyncVendorOpeningBalanceAction` (single party/year, idempotent,
      drift-aware per Edge Case 7).
- [ ] New action: `RolloverFiscalYearBalancesAction` (bulk, tenant-wide,
      calls the Resync action per party) — or implement bulk rollover by
      iterating the Resync action directly, per Edge Case 7's
      recommendation to share one implementation.
- [ ] Cascade-forward hook in `RecalculateCustomerBalanceAction` /
      `RecalculateVendorBalanceAction` (Edge Case 5 soft protection).
- [ ] Wire rollover trigger into the Settings action that updates
      `tenant_settings.fiscal_year_id`, gated on sort_order comparison.
- [ ] Decide sync-vs-queued-job based on expected tenant size (Edge Case 10).
- [ ] (Optional, v2) Enforce `fiscal_years.closed_at` in all
      transaction Store/Update/Delete/Restore actions (Edge Case 5 hard
      protection) + an explicit "reopen fiscal year" admin action.
- [ ] Frontend: confirmation/summary UI after fiscal year switch showing
      what was carried forward and what was skipped.
- [ ] Frontend: manual "resync opening balance" action on vendor/customer
      detail pages.
- [ ] Tests: cover edge cases 1, 2, 3, 4, 7, 11 explicitly (idempotency,
      manual-zero opening balance, cascade across 3+ years, new-party rows).
