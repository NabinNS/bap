"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Search, Plus, MoreVertical, Eye, Pencil, Trash2 } from "lucide-react";

type StockSidebarProduct = {
  ulid: string;
  name: string;
  stock: number;
  stock_balances?: { fiscal_year_id: number; opening_quantity: number; remaining_quantity: number }[];
};

type StockSidebarProps<T extends StockSidebarProduct> = {
  products: T[];
  loading: boolean;
  activeFiscalYearId: number | null;
  selectedProductUlid: string | null | undefined;
  search: string;
  onSearchChange: (value: string) => void;
  onSelect: (product: T) => void;
  onDelete: (product: T) => void;
  /** When provided, "Add" opens the quick-add side panel instead of navigating to the full create page. */
  onAddClick?: () => void;
  /** When provided, "Edit" opens the quick-edit side panel instead of navigating to the full edit page. */
  onEditClick?: (product: T) => void;
};

function remainingQuantity<T extends StockSidebarProduct>(product: T, activeFiscalYearId: number | null) {
  const balance = activeFiscalYearId && product.stock_balances?.find((b) => b.fiscal_year_id === activeFiscalYearId);
  return balance ? balance.remaining_quantity : null;
}

export function StockSidebar<T extends StockSidebarProduct>({
  products,
  loading,
  activeFiscalYearId,
  selectedProductUlid,
  search,
  onSearchChange,
  onSelect,
  onDelete,
  onAddClick,
  onEditClick,
}: StockSidebarProps<T>) {
  const filteredProducts = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  const [openMenuUlid, setOpenMenuUlid] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuUlid(null);
        setMenuPos(null);
      }
    }
    if (openMenuUlid) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openMenuUlid]);

  const openMenuProduct = products.find((p) => p.ulid === openMenuUlid) ?? null;

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
        {onAddClick ? (
          <button
            type="button"
            onClick={onAddClick}
            className="flex items-center gap-1.5 bg-black px-3 py-2 text-h4 font-semibold text-white hover:bg-black/80 transition-colors shrink-0 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Add
          </button>
        ) : (
          <Link
            href="/admin/products/create"
            className="flex items-center gap-1.5 bg-black px-3 py-2 text-h4 font-semibold text-white hover:bg-black/80 transition-colors shrink-0 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Add
          </Link>
        )}
      </div>

      <div className="flex flex-col flex-1 min-h-0 border border-slate-400 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 bg-black shrink-0">
          <span className="text-xs font-semibold text-white uppercase tracking-wide">Name</span>
          <span className="text-xs font-semibold text-white uppercase tracking-wide">Balance</span>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <p className="p-4 text-sm text-text-muted text-center">Loading...</p>
          ) : filteredProducts.length === 0 ? (
            <p className="p-4 text-sm text-text-muted text-center">No products found.</p>
          ) : (
            filteredProducts.map((product) => {
              const isSelected = selectedProductUlid === product.ulid;
              const remaining = remainingQuantity(product, activeFiscalYearId);
              return (
                <div
                  key={product.ulid}
                  onClick={() => onSelect(product)}
                  className={`flex items-center py-3.5 border-b border-slate-400 cursor-pointer transition-colors ${isSelected ? "bg-slate-200 border-l-2 border-l-slate-700 pl-[14px] pr-1" : "pl-4 pr-1 hover:bg-slate-50"}`}
                >
                  <span
                    title={product.name}
                    className={`text-sm truncate flex-1 min-w-0 mr-2 ${isSelected ? "font-semibold text-text-default" : "font-medium text-text-default"}`}
                  >
                    {product.name}
                  </span>
                  <span className="text-sm font-semibold text-right shrink-0 text-text-default">
                    {(remaining ?? 0).toLocaleString()}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (openMenuUlid === product.ulid) { setOpenMenuUlid(null); setMenuPos(null); return; }
                      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                      setMenuPos({ top: rect.bottom + 4, left: rect.right - 144 });
                      setOpenMenuUlid(product.ulid);
                    }}
                    className="ml-1 shrink-0 p-1 rounded hover:bg-slate-300 transition-colors text-text-muted hover:text-text-default cursor-pointer"
                  >
                    <MoreVertical className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {openMenuUlid && menuPos && typeof document !== "undefined" && createPortal(
        <div
          ref={menuRef}
          style={{ position: "fixed", top: menuPos.top, left: menuPos.left, zIndex: 9999 }}
          className="w-36 bg-white border border-slate-200 shadow-md"
        >
          <Link
            href={`/admin/products/${openMenuUlid}/view`}
            onClick={() => { setOpenMenuUlid(null); setMenuPos(null); }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-text-default hover:bg-slate-50 cursor-pointer"
          >
            <Eye className="h-3.5 w-3.5" /> View
          </Link>
          {onEditClick ? (
            <button
              type="button"
              onClick={() => {
                if (openMenuProduct) onEditClick(openMenuProduct);
                setOpenMenuUlid(null);
                setMenuPos(null);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-text-default hover:bg-slate-50 cursor-pointer"
            >
              <Pencil className="h-3.5 w-3.5" /> Edit
            </button>
          ) : (
            <Link
              href={`/admin/products/${openMenuUlid}/edit`}
              onClick={() => { setOpenMenuUlid(null); setMenuPos(null); }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-text-default hover:bg-slate-50 cursor-pointer"
            >
              <Pencil className="h-3.5 w-3.5" /> Edit
            </Link>
          )}
          <button
            onClick={() => {
              if (openMenuProduct) onDelete(openMenuProduct);
              setOpenMenuUlid(null);
              setMenuPos(null);
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        </div>,
        document.body
      )}
    </div>
  );
}
