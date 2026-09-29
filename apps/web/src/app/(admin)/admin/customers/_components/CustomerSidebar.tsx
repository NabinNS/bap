"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import { Search, MoreVertical, Trash2 } from "lucide-react";
import { Customer } from "./types";

type CustomerSidebarProps = {
  customers: Customer[];
  customersLoading: boolean;
  activeFiscalYearId: number | null;
  selectedCustomerUlid: string | null | undefined;
  search: string;
  onSearchChange: (value: string) => void;
  onSelect: (customer: Customer) => void;
  /** Rendered next to the search box, e.g. an "Add" button. */
  headerRight?: ReactNode;
  /** Rendered at the right edge of each row, e.g. a row action menu button. */
  renderRowAction?: (customer: Customer) => ReactNode;
  /** When provided, renders a header three-dot dropdown (e.g. "Recently Deleted") next to headerRight. */
  onTrashClick?: () => void;
};

function customerBalance(customer: Customer, activeFiscalYearId: number | null) {
  const balance = activeFiscalYearId && customer.balances?.find((b) => b.fiscal_year_id === activeFiscalYearId);
  return balance ? Number(balance.remaining_balance).toLocaleString() : "—";
}

export function CustomerSidebar({
  customers,
  customersLoading,
  activeFiscalYearId,
  selectedCustomerUlid,
  search,
  onSearchChange,
  onSelect,
  headerRight,
  renderRowAction,
  onTrashClick,
}: CustomerSidebarProps) {
  const filteredCustomers = customers.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));

  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const headerMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (headerMenuRef.current && !headerMenuRef.current.contains(e.target as Node)) setHeaderMenuOpen(false);
    }
    if (headerMenuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [headerMenuOpen]);

  return (
    <div className="w-80 shrink-0 flex flex-col h-full">
      <div className="flex items-center pb-3 shrink-0">
        <div className="relative flex-1">
          <Search className="absolute left-3 inset-y-0 my-auto h-3.5 w-3.5 text-text-muted pointer-events-none" />
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm border border-slate-400 focus:outline-none focus:border-slate-600"
          />
        </div>
        {headerRight}
        {onTrashClick && (
          <div className="relative" ref={headerMenuRef}>
            <button
              type="button"
              onClick={() => setHeaderMenuOpen((v) => !v)}
              title="More actions"
              className="flex items-center justify-center h-9 w-7 bg-black border-l border-slate-500 text-white hover:bg-black/80 transition-colors shrink-0 cursor-pointer"
            >
              <MoreVertical className="h-3.5 w-3.5" />
            </button>
            {headerMenuOpen && (
              <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-slate-200 shadow-md z-10">
                <button
                  type="button"
                  onClick={() => { setHeaderMenuOpen(false); onTrashClick(); }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-text-default hover:bg-slate-50 cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Recently Deleted
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col flex-1 min-h-0 border border-slate-400 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 bg-black shrink-0">
          <span className="text-xs font-semibold text-white uppercase tracking-wide">Name</span>
          <span className="text-xs font-semibold text-white uppercase tracking-wide">Balance</span>
        </div>

        <div className="flex-1 overflow-y-auto">
          {customersLoading ? (
            <p className="p-4 text-sm text-text-muted text-center">Loading...</p>
          ) : filteredCustomers.length === 0 ? (
            <p className="p-4 text-sm text-text-muted text-center">No customers found.</p>
          ) : (
            filteredCustomers.map((customer) => {
              const isSelected = selectedCustomerUlid === customer.ulid;
              return (
                <div
                  key={customer.ulid}
                  onClick={() => onSelect(customer)}
                  className={`flex items-center py-3.5 border-b border-slate-400 cursor-pointer transition-colors ${isSelected ? "bg-slate-200 border-l-2 border-l-slate-700 pl-[14px] pr-1" : "pl-4 pr-1 hover:bg-slate-50"}`}
                >
                  <span className={`text-sm truncate flex-1 min-w-0 ${isSelected ? "font-semibold text-text-default" : "font-medium text-text-default"}`}>{customer.name}</span>
                  <span className="text-sm font-semibold text-text-default text-right shrink-0">
                    {customerBalance(customer, activeFiscalYearId)}
                  </span>
                  {renderRowAction?.(customer)}
                </div>
              );
            })
          )}
        </div>

        {!customersLoading && filteredCustomers.length > 0 && (
          <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-400 bg-slate-50 shrink-0">
            <span className="text-sm font-bold text-text-default">Total</span>
            <span className="text-sm font-bold text-text-default">
              {filteredCustomers
                .reduce((sum, c) => {
                  const balance = activeFiscalYearId && c.balances?.find((b) => b.fiscal_year_id === activeFiscalYearId);
                  return sum + (balance ? Number(balance.remaining_balance) : 0);
                }, 0)
                .toLocaleString()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
