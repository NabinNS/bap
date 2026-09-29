"use client";

import { Modal } from "@/components/ui/Modal";

type TrashedVendor = {
  ulid: string;
  name: string;
};

type TrashedVendorsModalProps = {
  open: boolean;
  onClose: () => void;
  loading: boolean;
  vendors: TrashedVendor[];
  restoring: boolean;
  onRestore: (vendorUlid: string) => void;
};

export function TrashedVendorsModal({ open, onClose, loading, vendors, restoring, onRestore }: TrashedVendorsModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Recently Deleted Vendors"
      description="Deleted vendors. Restoring brings the vendor and its ledger back."
      initialWidth={480}
      initialHeight={420}
    >
      {loading && <p className="text-sm text-text-muted">Loading…</p>}
      {!loading && vendors.length === 0 && (
        <p className="text-sm text-text-muted">No deleted vendors.</p>
      )}
      {!loading && vendors.length > 0 && (
        <div className="space-y-2">
          {vendors.map((vendor) => (
            <div key={vendor.ulid} className="flex items-center justify-between border border-slate-200 px-3 py-2">
              <p className="text-sm font-semibold text-text-default">{vendor.name}</p>
              <button
                type="button"
                disabled={restoring}
                onClick={() => onRestore(vendor.ulid)}
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
