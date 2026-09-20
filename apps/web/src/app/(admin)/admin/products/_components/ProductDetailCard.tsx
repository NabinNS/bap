"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Plus, ShoppingCart, MoreVertical, Eye, Pencil, Trash2 } from "lucide-react";

type DetailProduct = {
  ulid: string;
  name: string;
  thumbnail: string | null;
  sku: string | null;
  cost_price: number | null;
  wacc: number | null;
  sales_price: number | null;
  stock: number;
  low_stock_quantity: number | null;
  is_active: boolean;
  category: { ulid: string; name: string } | null;
  brand: { ulid: string; name: string } | null;
  active_discount: { percentage: number } | null;
  stock_balances?: { fiscal_year_id: number; opening_quantity: number; remaining_quantity: number }[];
};

export function ProductDetailCard({
  product,
  activeFiscalYearId,
  onEditOpeningQuantity,
  onPurchaseClick,
  onSalesClick,
  onEditClick,
  onDelete,
}: {
  product: DetailProduct | null;
  activeFiscalYearId?: number | null;
  onEditOpeningQuantity?: () => void;
  onPurchaseClick?: () => void;
  onSalesClick?: () => void;
  /** When provided, "Edit" opens the quick-edit side panel instead of navigating to the full edit page. */
  onEditClick?: (product: DetailProduct) => void;
  onDelete?: (product: DetailProduct) => void;
}) {
  const activeBalance = activeFiscalYearId
    ? product?.stock_balances?.find((b) => b.fiscal_year_id === activeFiscalYearId) ?? null
    : null;

  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setMenuPos(null);
      }
    }
    if (menuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  return (
    <div className="bg-white px-5 py-4 space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          {product?.thumbnail ? (
            <img src={product.thumbnail} alt={product.name} className="h-14 w-14 object-cover border border-slate-200 shrink-0" />
          ) : (
            <div className="h-14 w-14 border border-slate-200 bg-slate-100 shrink-0" />
          )}
          <div className="min-w-0">
            <p className="text-lg font-bold text-text-default leading-tight flex items-center gap-1.5">
              {product ? (
                <>
                  <span className="text-base font-medium text-text-muted">Name:</span>
                  {product.name}
                </>
              ) : (
                <span className="text-text-muted font-normal text-sm">Select a product</span>
              )}
            </p>
            {product && (
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                {[
                  product.sku && (
                    <span key="sku" className="text-text-body text-sm-custom">
                      <span className="font-medium text-text-muted">Part No:</span> <span className="font-mono">{product.sku}</span>
                    </span>
                  ),
                  product.brand && (
                    <span key="brand" className="text-text-body text-sm-custom">
                      <span className="font-medium text-text-muted">Brand:</span> {product.brand.name}
                    </span>
                  ),
                  product.category && (
                    <span key="category" className="text-text-body text-sm-custom">
                      <span className="font-medium text-text-muted">Category:</span> {product.category.name}
                    </span>
                  ),
                  <span key="status" className={`text-xs font-semibold px-2 py-0.5 ${product.is_active ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                    {product.is_active ? "Active" : "Inactive"}
                  </span>,
                ]
                  .filter(Boolean)
                  .map((node, i) => (
                    <span key={i} className="flex items-center gap-3">
                      {i > 0 && <span className="text-slate-300">|</span>}
                      {node}
                    </span>
                  ))}
              </div>
            )}
          </div>
        </div>

        {product && (
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={onPurchaseClick}
              className="flex items-center gap-2 bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-black/80 transition-colors cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Goods Purchased
            </button>
            <button
              type="button"
              onClick={onSalesClick}
              className="flex items-center gap-2 border border-slate-300 px-4 py-2 text-sm font-semibold text-text-default hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <ShoppingCart className="h-4 w-4" />
              Goods Sales
            </button>
            <button
              type="button"
              onClick={(e) => {
                if (menuOpen) { setMenuOpen(false); setMenuPos(null); return; }
                const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                setMenuPos({ top: rect.bottom + 4, left: rect.right - 144 });
                setMenuOpen(true);
              }}
              className="flex items-center border border-slate-300 px-1.5 py-2.5 text-text-muted hover:bg-slate-50 hover:text-text-default transition-colors cursor-pointer"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {product && menuOpen && menuPos && typeof document !== "undefined" && createPortal(
        <div
          ref={menuRef}
          style={{ position: "fixed", top: menuPos.top, left: menuPos.left, zIndex: 9999 }}
          className="w-36 bg-white border border-slate-200 shadow-md"
        >
          <Link
            href={`/admin/products/${product.ulid}/view`}
            onClick={() => { setMenuOpen(false); setMenuPos(null); }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-text-default hover:bg-slate-50 cursor-pointer"
          >
            <Eye className="h-3.5 w-3.5" /> View
          </Link>
          {onEditClick ? (
            <button
              type="button"
              onClick={() => { onEditClick(product); setMenuOpen(false); setMenuPos(null); }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-text-default hover:bg-slate-50 cursor-pointer"
            >
              <Pencil className="h-3.5 w-3.5" /> Edit
            </button>
          ) : (
            <Link
              href={`/admin/products/${product.ulid}/edit`}
              onClick={() => { setMenuOpen(false); setMenuPos(null); }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-text-default hover:bg-slate-50 cursor-pointer"
            >
              <Pencil className="h-3.5 w-3.5" /> Edit
            </Link>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={() => {
                if (confirm(`Delete "${product.name}"?`)) onDelete(product);
                setMenuOpen(false);
                setMenuPos(null);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
          )}
        </div>,
        document.body
      )}

      {product && (
        <div className="grid grid-cols-6 gap-4 pt-1 border-t border-slate-300">
          <div>
            <p className="text-sm-custom text-text-body">Cost Price</p>
            <p className="text-sm-custom font-bold text-text-default mt-0.5">{product.cost_price != null ? product.cost_price.toLocaleString() : "—"}</p>
          </div>
          <div>
            <p className="text-sm-custom text-text-body">WACC</p>
            <p className="text-sm-custom font-bold text-text-default mt-0.5">{product.wacc != null ? product.wacc.toLocaleString() : "—"}</p>
          </div>
          <div>
            <p className="text-sm-custom text-text-body">Sales Price</p>
            <p className="text-sm-custom font-bold text-text-default mt-0.5">{product.sales_price != null ? product.sales_price.toLocaleString() : "—"}</p>
          </div>
          <div>
            <p className="text-sm-custom text-text-body">Low Stock At</p>
            <p className="text-sm-custom font-bold text-text-default mt-0.5">{product.low_stock_quantity ?? "—"}</p>
          </div>
          <div>
            <p className="text-sm-custom text-text-body">Latest Discount</p>
            <p className="text-sm-custom font-bold text-text-default mt-0.5">
              {product.active_discount ? `${product.active_discount.percentage}%` : "—"}
            </p>
          </div>
          <button
            type="button"
            onClick={onEditOpeningQuantity}
            className="text-left cursor-pointer group"
          >
            <p className="text-sm-custom text-text-body">Opening Qty (FY)</p>
            <p className="text-sm-custom font-bold text-text-default mt-0.5 group-hover:underline">
              {(activeBalance?.opening_quantity ?? 0).toLocaleString()}
            </p>
          </button>
        </div>
      )}
    </div>
  );
}
