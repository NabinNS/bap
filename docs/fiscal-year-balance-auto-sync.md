# Fiscal Year Balance Auto-Sync

How vendor balances, customer balances, and product stock quantities stay
correct across fiscal years when a transaction is added/edited/deleted in a
non-current (e.g. backdated) fiscal year.

## The data shape

Three tables share the same shape: one row per `(tenant, party, fiscal_year)`.

| Table | Party | Tracks |
|---|---|---|
| `acc_vendor_balances` | vendor | `opening_balance`, `remaining_balance` |
| `acc_customer_balances` | customer | `opening_balance`, `remaining_balance` |
| `product_stock_balances` | product | `opening_quantity`, `remaining_quantity` |

For a given year: `remaining = opening + net movement for that year`
(credit − debit for money; purchases − sales for stock).

A later fiscal year's `opening` is supposed to equal the prior year's
`remaining` — that's just double-entry continuity, not a business choice.

## The problem this solves

If you add a transaction into an **old** fiscal year (e.g. the header's
fiscal year picker is set to 80/81, but 81/82, 82/83, 83/84 already exist),
only 80/81's `remaining_balance` changes. Nothing else updates on its own —
every later year's `opening`/`remaining` silently goes stale.

## The fix: two actions, now always chained

Each entity (vendor, customer, product) has:

- **`Recalculate*BalanceAction`** — recomputes `remaining` for **one** fiscal
  year only. Creates the balance row on demand if it doesn't exist yet. Never
  touches any other year.
- **`Sync*BalanceAction`** — calls `Recalculate` for the given year, then
  walks forward through every later fiscal year that already has a row for
  this party (via `nextFiscalYearBalance`, ordered by `FiscalYear.sort_order`),
  overwriting each one's `opening` with the prior year's freshly recalculated
  `remaining`, and recalculating that year too. Capped at 500 iterations
  (cycle-safety, not a real limit).

**Every transaction-writing action now calls `Sync`, not `Recalculate`
directly** — so the cascade happens automatically on every save, no matter
which fiscal year the transaction lands in:

- Vendor: `StoreAccVendorTransactionAction`, `UpdateAccVendorTransactionAction`,
  `DeleteAccVendorTransactionAction`, `RestoreAccVendorTransactionAction`,
  `DeleteAccVendorTransactionItemAction`, `RecalculateAccVendorTransactionTotalsAction`.
- Customer: the exact same six, mirrored under `AccCustomers`.
- Product stock: `CreateProductTransactionItemAction`,
  `UpdateProductTransactionItemAction`, `DeleteProductTransactionItemAction`,
  `RestoreProductTransactionItemAction`.

The manual **"Sync Balance"** button in the UI (vendor/customer/product pages)
still exists and calls the same `Sync*BalanceAction` — it's now mostly a
safety net (e.g. for fixing drift that predates this change, or a fiscal year
reorder) rather than the primary mechanism.

## The tradeoff we accepted

`Sync` overwrites a later year's `opening` unconditionally — including one a
human deliberately set to something other than a plain carry-forward (an
audit correction, a migration fix, etc). Before this change, that was
protected: only the explicit "Sync Balance" click would do that overwrite.
Now it happens silently on every earlier-year write.

We chose this deliberately (see "Decision" below) because a diverged opening
balance isn't normally a valid state to begin with — but it means there's no
way left to make year N+1's opening *intentionally* differ from year N's
closing without it getting reset the next time year N is touched.

## What this does NOT cover

- **WACC** (`products.wacc`) is a global column, not per-fiscal-year. It's
  untouched by `RecalculateProductStockBalanceAction`/`Sync*` — it only
  changes when transaction items themselves are created/updated/deleted
  (purchase price blending), independent of this cascade.
- **No fiscal-year rollover at year-switch time** (carrying last year's
  closing into a brand-new year when the tenant's active year changes in
  Settings) — that's a separate, not-yet-implemented feature; see
  `fiscal-year-balance-rollover-plan.md`.
- **No bulk "sync all vendors/customers/products"** — sync is always
  triggered per-party, as a side effect of writing to that party's
  transactions. Explicitly out of scope per product decision.

## Decision log

- Considered: fully automatic cascade vs. "smart" cascade that stops at the
  first year whose opening balance doesn't match a plain carry-forward
  (preserving manual overrides). **Chose fully automatic** — a mismatched
  opening balance isn't a state worth preserving by default.
- Verified live (via `tinker`) for both vendor and product stock: adding and
  then deleting a backdated transaction correctly cascades forward and back
  through a later fiscal year with no manual "Sync Balance" click.
