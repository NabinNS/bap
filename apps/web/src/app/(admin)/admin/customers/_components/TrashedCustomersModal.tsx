"use client";

import { Modal } from "@/components/ui/Modal";

type TrashedCustomer = {
  ulid: string;
  name: string;
};

type TrashedCustomersModalProps = {
  open: boolean;
  onClose: () => void;
  loading: boolean;
  customers: TrashedCustomer[];
  restoring: boolean;
  onRestore: (customerUlid: string) => void;
};

export function TrashedCustomersModal({ open, onClose, loading, customers, restoring, onRestore }: TrashedCustomersModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Recently Deleted Customers"
      description="Deleted customers. Restoring brings the customer and its ledger back."
      initialWidth={480}
      initialHeight={420}
    >
      {loading && <p className="text-sm text-text-muted">Loading…</p>}
      {!loading && customers.length === 0 && (
        <p className="text-sm text-text-muted">No deleted customers.</p>
      )}
      {!loading && customers.length > 0 && (
        <div className="space-y-2">
          {customers.map((customer) => (
            <div key={customer.ulid} className="flex items-center justify-between border border-slate-200 px-3 py-2">
              <p className="text-sm font-semibold text-text-default">{customer.name}</p>
              <button
                type="button"
                disabled={restoring}
                onClick={() => onRestore(customer.ulid)}
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
