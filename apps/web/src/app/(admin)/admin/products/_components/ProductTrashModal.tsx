"use client";

import { Modal } from "@/components/ui/Modal";

type TrashedProduct = {
  ulid: string;
  name: string;
  sku: string | null;
};

type ProductTrashModalProps = {
  open: boolean;
  onClose: () => void;
  loading: boolean;
  products: TrashedProduct[];
  restoring: boolean;
  onRestore: (productUlid: string) => void;
};

export function ProductTrashModal({ open, onClose, loading, products, restoring, onRestore }: ProductTrashModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Recently Deleted Products"
      description="Deleted products. Restoring brings the product — and its stock/pricing history — back into the catalogue."
      initialWidth={520}
      initialHeight={420}
    >
      {loading && <p className="text-sm text-text-muted">Loading…</p>}
      {!loading && products.length === 0 && (
        <p className="text-sm text-text-muted">No deleted products.</p>
      )}
      {!loading && products.length > 0 && (
        <div className="space-y-2">
          {products.map((product) => (
            <div key={product.ulid} className="flex items-center justify-between border border-slate-200 px-3 py-2">
              <div>
                <p className="text-sm font-semibold text-text-default">{product.name}</p>
                {product.sku && <p className="text-xs text-text-muted">Part No: {product.sku}</p>}
              </div>
              <button
                type="button"
                disabled={restoring}
                onClick={() => onRestore(product.ulid)}
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
