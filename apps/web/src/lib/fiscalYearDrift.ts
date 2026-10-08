/**
 * Whether a party's balance chain has drifted downstream from a given fiscal year.
 *
 * A transaction recorded into a non-active fiscal year keeps that single year's
 * remaining_balance accurate immediately, but does NOT propagate into later years'
 * opening_balance (that only happens when the user presses "Sync Balance"). So a later year
 * is out of sync exactly when its opening_balance no longer matches the remaining_balance of
 * the fiscal year right before it — a pure comparison of already-stored values, no
 * recomputation needed.
 */
export function hasDownstreamDrift<
  TBalance extends { fiscal_year_id: number; opening: number; remaining: number },
  TFiscalYear extends { id: number; sort_order: number },
>(balances: TBalance[], fiscalYears: TFiscalYear[], fromFiscalYearId: number): boolean {
  const sortedYears = [...fiscalYears].sort((a, b) => a.sort_order - b.sort_order);
  const balanceByYear = new Map(balances.map((b) => [b.fiscal_year_id, b]));
  const startIndex = sortedYears.findIndex((fy) => fy.id === fromFiscalYearId);

  if (startIndex === -1) return false;

  for (let i = startIndex; i < sortedYears.length - 1; i++) {
    const current = balanceByYear.get(sortedYears[i].id);
    const next = balanceByYear.get(sortedYears[i + 1].id);
    if (!current || !next) continue;
    if (next.opening !== current.remaining) return true;
  }

  return false;
}
