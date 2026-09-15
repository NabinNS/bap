"use client";

import { Modal } from "@/components/ui/Modal";
import { getParticularLabel } from "../constants";

type TrashedTransaction = {
  ulid: string;
  date: string;
  particular: string;
  voucher_no: string | null;
  debit: number | null;
  credit: number | null;
};

type TrashModalProps = {
  open: boolean;
  onClose: () => void;
  loading: boolean;
  transactions: TrashedTransaction[];
  restoring: boolean;
  onRestore: (txUlid: string) => void;
};

export function TrashModal({ open, onClose, loading, transactions, restoring, onRestore }: TrashModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Recently Deleted"
      description="Deleted transactions for this vendor. Restoring recalculates the vendor's balance, but does not re-apply any stock/cost changes the transaction originally made."
      initialWidth={520}
      initialHeight={420}
    >
      {loading && <p className="text-sm text-text-muted">Loading…</p>}
      {!loading && transactions.length === 0 && (
        <p className="text-sm text-text-muted">Nothing deleted for this vendor.</p>
      )}
      {!loading && transactions.length > 0 && (
        <div className="space-y-2">
          {transactions.map((tx) => (
            <div key={tx.ulid} className="flex items-center justify-between border border-slate-200 px-3 py-2">
              <div>
                <p className="text-sm font-semibold text-text-default">{getParticularLabel(tx.particular)}</p>
                <p className="text-xs text-text-muted">
                  {tx.date} {tx.voucher_no ? `· Voucher ${tx.voucher_no}` : ""} {tx.debit != null ? `· Debit ${Number(tx.debit).toLocaleString()}` : ""} {tx.credit != null ? `· Credit ${Number(tx.credit).toLocaleString()}` : ""}
                </p>
              </div>
              <button
                type="button"
                disabled={restoring}
                onClick={() => onRestore(tx.ulid)}
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
