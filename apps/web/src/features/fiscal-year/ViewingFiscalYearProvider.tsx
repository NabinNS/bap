"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

const STORAGE_KEY = "bap:viewing_fiscal_year_id";

interface ViewingFiscalYearContextValue {
  /** The fiscal year Accounts/Product-Stock screens are currently showing data for and
   *  recording new transactions into. Independent of the tenant's active fiscal_year_id. */
  viewingFiscalYearId: number | null;
  setViewingFiscalYearId: (fiscalYearId: number) => void;
}

const ViewingFiscalYearContext = createContext<ViewingFiscalYearContextValue | null>(null);

/**
 * Tracks which fiscal year Accounts/Product-Stock screens are viewing, independently of the
 * tenant's active fiscal_year_id in Settings. Persisted to sessionStorage — survives page
 * navigation and reloads within the same browser tab, but resets to the tenant's active
 * fiscal year once the tab/browser is closed. Never written back to the server.
 */
export function ViewingFiscalYearProvider({
  activeFiscalYearId,
  children,
}: {
  activeFiscalYearId: number | null;
  children: React.ReactNode;
}) {
  const [viewingFiscalYearId, setViewingFiscalYearIdState] = useState<number | null>(null);

  // Seed from sessionStorage once we know the tenant's active fiscal year (used as the
  // default when there's no stored preference yet for this tab's session).
  useEffect(() => {
    if (viewingFiscalYearId !== null || activeFiscalYearId === null) return;

    let stored: number | null = null;
    try {
      const raw = window.sessionStorage.getItem(STORAGE_KEY);
      stored = raw ? Number(raw) : null;
    } catch {
      // sessionStorage unavailable (private mode, etc.) — fall back to the active fiscal year.
    }

    setViewingFiscalYearIdState(stored ?? activeFiscalYearId);
  }, [activeFiscalYearId, viewingFiscalYearId]);

  const setViewingFiscalYearId = useCallback((fiscalYearId: number) => {
    setViewingFiscalYearIdState(fiscalYearId);
    try {
      window.sessionStorage.setItem(STORAGE_KEY, String(fiscalYearId));
    } catch {
      // Ignore — the in-memory state still updates for this session.
    }
  }, []);

  return (
    <ViewingFiscalYearContext.Provider value={{ viewingFiscalYearId, setViewingFiscalYearId }}>
      {children}
    </ViewingFiscalYearContext.Provider>
  );
}

export function useViewingFiscalYear(): ViewingFiscalYearContextValue {
  const ctx = useContext(ViewingFiscalYearContext);
  if (!ctx) {
    throw new Error("useViewingFiscalYear must be used within a ViewingFiscalYearProvider");
  }
  return ctx;
}
