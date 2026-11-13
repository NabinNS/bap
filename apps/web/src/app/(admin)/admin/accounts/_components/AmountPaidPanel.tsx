"use client";

import { useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/api";
import { toast } from "@/lib/toast";
import { SelectField } from "@/components/ui/form/FormField";
import { SlidePanel } from "@/components/ui/form/SlidePanelForm";
import { BsDateInput, getTodayBs, isValidBsDate } from "@/components/ui/form/BsDateInput";
import { MultiImageUpload } from "@/components/ui/form/MultiImageUpload";
import { useImageGroup } from "@/hooks/useImageGroup";
import { TRANSACTION_PARTICULARS, getParticularDirection } from "../constants";
import { useInvalidateVendorTransactions } from "./useAccountingInvalidation";

export interface AmountPaidPanelProps {
  open: boolean;
  onClose: () => void;
  vendorUlid: string;
  /** Fiscal year the payment is recorded against — follows the header's selected year. */
  fiscalYearId: number | null;
}

/**
 * Quick side-panel version of the Amount Paid page — records a plain debit/credit payment
 * for the selected vendor without leaving the ledger. Auto-saves once date, particular and
 * amount are filled, same as the full page.
 */
export function AmountPaidPanel({ open, onClose, vendorUlid, fiscalYearId }: AmountPaidPanelProps) {
  const invalidateVendorTransactions = useInvalidateVendorTransactions();

  const [date, setDate] = useState(getTodayBs);
  const [voucherNo, setVoucherNo] = useState("");
  const [particular, setParticular] = useState("cash");
  const [chequeNo, setChequeNo] = useState("");
  const [amount, setAmount] = useState("");
  const [savedTxUlid, setSavedTxUlid] = useState<string | null>(null);
  const savedTxUlidRef = useRef<string | null>(null);
  const sessionIdRef = useRef<string>("");
  const receiptImage = useImageGroup("acc_vendor_transaction", "acc-vendor-transactions", "receipt");

  function resetForm() {
    setDate(getTodayBs());
    setVoucherNo("");
    setParticular("cash");
    setChequeNo("");
    setAmount("");
    setSavedTxUlid(null);
    savedTxUlidRef.current = null;
    sessionIdRef.current = crypto.randomUUID();
    receiptImage.reset();
  }

  // Resets the draft both when the panel is freshly opened and whenever the vendor it's
  // open for changes (e.g. the user picks a different vendor in the sidebar while this
  // panel is still open) — otherwise a stale savedTxUlidRef from the previous vendor would
  // get PATCHed under the new vendor's route, a vendor/transaction mismatch.
  useEffect(() => {
    if (open) resetForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fresh draft on open or vendor change
  }, [open, vendorUlid]);

  const [saving, setSaving] = useState(false);

  function isFormReady(): boolean {
    return isValidBsDate(date) && !!particular && !!amount && Number(amount) > 0;
  }

  // Clicking "Done" blurs whichever field had focus, firing trySave() at nearly the same
  // moment the submit handler's own trySave() runs — both would otherwise start independent
  // POSTs. Routing both through this shared in-flight promise means the second caller awaits
  // the first save instead of firing a duplicate request (mirrors amount-paid/page.tsx).
  const saveInFlightRef = useRef<Promise<string | null> | null>(null);

  function trySave(): Promise<string | null> {
    if (saveInFlightRef.current) return saveInFlightRef.current;
    if (!isFormReady()) return Promise.resolve(savedTxUlidRef.current);

    const direction = getParticularDirection(particular);
    const payload = {
      date,
      particular,
      voucher_no: voucherNo || null,
      cheque_no: particular === "cheque" ? chequeNo || null : null,
      debit: direction === "debit" ? Number(amount) : null,
      credit: direction === "credit" ? Number(amount) : null,
      fiscal_year_id: fiscalYearId ?? undefined,
    };
    const endpoint = savedTxUlidRef.current
      ? `/acc-vendors/${vendorUlid}/transactions/${savedTxUlidRef.current}`
      : `/acc-vendors/${vendorUlid}/transactions`;
    setSaving(true);
    const promise = apiFetch<{ data: { ulid: string } }>(endpoint, {
      method: savedTxUlidRef.current ? "PATCH" : "POST",
      body: JSON.stringify(payload),
      headers: { "X-Activity-Session": sessionIdRef.current },
    })
      .then((res) => {
        const ulid = savedTxUlidRef.current ?? res.data.ulid;
        savedTxUlidRef.current = ulid;
        setSavedTxUlid(ulid);
        invalidateVendorTransactions(vendorUlid);
        return ulid;
      })
      .catch((err: any) => {
        toast.error("Failed to save payment", err?.message ?? "Something went wrong.");
        return savedTxUlidRef.current;
      })
      .finally(() => {
        setSaving(false);
        saveInFlightRef.current = null;
      });

    saveInFlightRef.current = promise;
    return promise;
  }

  async function ensureTransactionUlid(): Promise<string | null> {
    if (savedTxUlidRef.current) return savedTxUlidRef.current;
    if (!isFormReady()) {
      toast.error("Fill in the payment first", "Date, particular and amount are required before attaching a receipt.");
      return null;
    }
    return trySave();
  }

  function handleClose() {
    if (savedTxUlidRef.current) toast.success("Payment saved", "The payment has been recorded.");
    onClose();
  }

  return (
    <SlidePanel
      open={open}
      onClose={handleClose}
      title="Amount Paid"
      description="Record a payment made to this vendor. Auto-saves as you edit."
      submitLabel={saving ? "Saving..." : "Done"}
      onSubmit={async () => {
        if (!isFormReady()) {
          toast.error("Fill in required fields", "Date, particular and amount are required.");
          return;
        }
        await trySave();
        handleClose();
      }}
    >
      <div className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-text-default">Date</label>
          <BsDateInput
            value={date}
            onChange={setDate}
            onBlur={trySave}
            className="mt-1 w-full h-10 px-3 text-sm font-medium text-black border border-slate-400 focus:outline-none focus:border-slate-600 bg-white"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-text-default">Voucher No</label>
          <input
            type="text"
            value={voucherNo}
            onChange={(e) => setVoucherNo(e.target.value)}
            onBlur={trySave}
            className="mt-1 w-full h-10 px-3 text-sm font-medium text-black border border-slate-400 focus:outline-none focus:border-slate-600 bg-white"
          />
        </div>
        <div>
          <SelectField
            label="Particular"
            value={particular}
            onChange={(e) => {
              const value = e.target.value;
              setParticular(value);
              if (value !== "cheque") setChequeNo("");
              trySave();
            }}
            options={TRANSACTION_PARTICULARS.map((p) => ({ label: p.label, value: p.value }))}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-text-default">
            Amount <span className="normal-case">({getParticularDirection(particular) === "debit" ? "Debit" : "Credit"})</span>
          </label>
          <input
            type="number" min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            onBlur={trySave}
            className="mt-1 w-full h-10 px-3 text-sm font-medium text-black border border-slate-400 focus:outline-none focus:border-slate-600 bg-white"
          />
        </div>
        {particular === "cheque" && (
          <div>
            <label className="block text-sm font-semibold text-text-default">Cheque No</label>
            <input
              type="text"
              value={chequeNo}
              onChange={(e) => setChequeNo(e.target.value)}
              onBlur={trySave}
              className="mt-1 w-full h-10 px-3 text-sm font-medium text-black border border-slate-400 focus:outline-none focus:border-slate-600 bg-white"
            />
          </div>
        )}
      </div>

      <div>
        <MultiImageUpload
          label="Receipt Photo"
          value={receiptImage.images}
          onChange={receiptImage.setImages}
          savedImages={receiptImage.savedImages}
          groupName={receiptImage.groupName}
          onGroupNameChange={receiptImage.setGroupName}
          onGroupNameBlur={receiptImage.updateGroupName}
          onSave={async () => {
            const ulid = await ensureTransactionUlid();
            if (ulid) await receiptImage.save(ulid);
          }}
          onRemoveSaved={receiptImage.removeSaved}
          saving={receiptImage.saving}
          uploadStates={receiptImage.uploadStates}
          max={1}
        />
      </div>
    </SlidePanel>
  );
}
