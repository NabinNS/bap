"use client";

import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { ProductOption } from "./ProductCombobox";

export type VendorPrice = {
  vendor_id: number;
  vendor_ulid: string;
  vendor_name: string;
  rate: number;
  date: string;
};

type Props = {
  product: ProductOption | null;
  /** When provided, shows a close (X) button in the header. */
  onClose?: () => void;
  /** When provided, each vendor row becomes clickable (e.g. to move the current line item to that vendor). */
  onSelectVendor?: (price: VendorPrice) => void;
};

/** Right-side panel showing, for the currently active product, the latest price each vendor has charged for it — cheapest first. */
export function VendorPricePanel({ product, onClose, onSelectVendor }: Props) {
  const { data, isFetching } = useQuery({
    queryKey: ["products", "vendor-prices", product?.ulid],
    queryFn: () => apiFetch<{ data: VendorPrice[] }>(`/products/${product!.ulid}/vendor-prices`),
    enabled: !!product,
    staleTime: 5 * 60_000,
  });

  const prices = data?.data ?? [];

  return (
    <div className="w-72 shrink-0 bg-white border border-slate-300 flex flex-col">
      <div className="bg-black px-3 py-2.5 flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-white uppercase tracking-wide">Vendor Price Comparison</span>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="flex h-5 w-5 items-center justify-center text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="py-4 flex-1 min-h-0 overflow-auto">
        {!product ? (
          <p className="text-sm text-text-muted px-4">Select a product to see vendor price history.</p>
        ) : isFetching ? (
          <p className="text-sm text-text-muted px-4">Loading price history...</p>
        ) : prices.length === 0 ? (
          <p className="text-sm text-text-muted px-4">No purchase history for {product.name} yet.</p>
        ) : (
          <>
            <p className="text-sm font-semibold text-black mb-3 px-4 truncate" title={product.name}>{product.name}</p>
            <div className="space-y-0">
              {prices.map((p, i) => (
                <div
                  key={p.vendor_id}
                  onMouseDown={(e) => onSelectVendor && e.preventDefault()}
                  onClick={() => onSelectVendor?.(p)}
                  className={`px-4 py-2 border-t border-b -mt-px ${onSelectVendor ? "cursor-pointer hover:bg-slate-100" : ""} ${i === 0 ? "border-green-200 bg-green-50" : "border-slate-200"}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-black truncate">{p.vendor_name}</span>
                    <span className={`text-sm font-semibold ${i === 0 ? "text-green-700" : "text-black"}`}>Rs {p.rate}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <span className="text-xs text-text-muted">{p.date}</span>
                    {i === 0 && <span className="text-xs font-semibold text-green-700">Best price</span>}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
