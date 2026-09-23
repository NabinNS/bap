"use client";

import { Modal } from "@/components/ui/Modal";

type TrashedItem = {
  ulid: string;
  product_name: string;
  quantity: number;
  rate: number;
  discount: number;
  total: number;
};

type TrashedItemsModalProps = {
  open: boolean;
  onClose: () => void;
  loading: boolean;
  items: TrashedItem[];
  restoring: boolean;
  onRestore: (itemUlid: string) => void;
};

export function TrashedItemsModal({ open, onClose, loading, items, restoring, onRestore }: TrashedItemsModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Recently Deleted Items"
      description="Deleted line items on this bill. Restoring re-applies the quantity to the product's stock (and WACC, for a purchase) and recomputes the bill's totals."
      initialWidth={520}
      initialHeight={420}
    >
      {loading && <p className="text-sm text-text-muted">Loading…</p>}
      {!loading && items.length === 0 && (
        <p className="text-sm text-text-muted">Nothing deleted on this bill.</p>
      )}
      {!loading && items.length > 0 && (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.ulid} className="flex items-center justify-between border border-slate-200 px-3 py-2">
              <div>
                <p className="text-sm font-semibold text-text-default">{item.product_name}</p>
                <p className="text-xs text-text-muted">
                  Qty {item.quantity.toLocaleString()} · Rate {item.rate.toLocaleString()}
                  {item.discount ? ` · Discount ${item.discount.toLocaleString()}` : ""} · Total {item.total.toLocaleString()}
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
          ))}
        </div>
      )}
    </Modal>
  );
}
