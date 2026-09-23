"use client";

import { Modal } from "@/components/ui/Modal";

type TrashedItem = {
  ulid: string;
  date: string;
  type: "purchase" | "sale";
  purchase_quantity: number | null;
  purchase_price: number | null;
  sales_quantity: number | null;
  sales_price: number | null;
};

type TrashModalProps = {
  open: boolean;
  onClose: () => void;
  loading: boolean;
  items: TrashedItem[];
  restoring: boolean;
  onRestore: (itemUlid: string) => void;
};

export function TrashModal({ open, onClose, loading, items, restoring, onRestore }: TrashModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Recently Deleted"
      description="Deleted stock entries for this product. Restoring re-applies the quantity to stock (and WACC, for a purchase)."
      initialWidth={520}
      initialHeight={420}
    >
      {loading && <p className="text-sm text-text-muted">Loading…</p>}
      {!loading && items.length === 0 && (
        <p className="text-sm text-text-muted">Nothing deleted for this product.</p>
      )}
      {!loading && items.length > 0 && (
        <div className="space-y-2">
          {items.map((item) => {
            const isPurchase = item.type === "purchase";
            const qty = isPurchase ? item.purchase_quantity : item.sales_quantity;
            const rate = isPurchase ? item.purchase_price : item.sales_price;
            return (
              <div key={item.ulid} className="flex items-center justify-between border border-slate-200 px-3 py-2">
                <div>
                  <p className="text-sm font-semibold text-text-default">{isPurchase ? "Purchase" : "Sale"}</p>
                  <p className="text-xs text-text-muted">
                    {item.date}
                    {qty != null ? ` · Qty ${qty.toLocaleString()}` : ""}
                    {rate != null ? ` · Rate ${rate.toLocaleString()}` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={restoring}
                  onClick={() => onRestore(item.ulid)}
                  className="shrink-0 px-3 py-1.5 text-xs font-semibold text-text-default border border-slate-300 hover:bg-slate-50 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  Restore
                </button>
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
}
