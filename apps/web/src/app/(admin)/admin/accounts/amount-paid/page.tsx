"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MapPin, Phone, Receipt, Search, ArrowLeft, ListOrdered } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { toast } from "@/lib/toast";
import { BsDateInput, getTodayBs, isValidBsDate } from "@/components/ui/form/BsDateInput";
import { SelectField } from "@/components/ui/form/FormField";
import { TRANSACTION_PARTICULARS, getParticularDirection } from "../constants";
import { MultiImageUpload } from "@/components/ui/form/MultiImageUpload";
import { useImageGroup } from "@/hooks/useImageGroup";

type VendorBalance = {
  fiscal_year_id: number;
  opening_balance: string;
  remaining_balance: string;
};

type Vendor = {
  ulid: string;
  name: string;
  address: string | null;
  phone: string | null;
  telephone: string | null;
  vat_no: string | null;
  balances: VendorBalance[];
};

type Meta = {
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
  from: number;
  to: number;
};

type SavedTransaction = {
  ulid: string;
  fiscal_year_id: number | null;
  date: string;
  particular: string;
  voucher_no: string | null;
  cheque_no: string | null;
  debit: number | null;
  credit: number | null;
};

type FiscalYear = {
  id: number;
  ulid: string;
  name: string;
};

function AmountPaidContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const vendorParam = searchParams.get("vendor");
  const editTransactionParam = searchParams.get("transaction");
  const queryClient = useQueryClient();

  const [sideSearch, setSideSearch] = useState("");
  const [selectedVendorUlid, setSelectedVendorUlid] = useState<string | null>(vendorParam);
  const [billDate, setBillDate] = useState(getTodayBs);
  const [billNo, setBillNo] = useState("");
  const [amount, setAmount] = useState("");
  const [particular, setParticular] = useState<string>("cash");
  const [chequeNo, setChequeNo] = useState("");
  const [editingTransactionUlid, setEditingTransactionUlid] = useState<string | null>(null);
  // Which fiscal year this payment is recorded against — defaults to the tenant's active
  // one once it loads, but the user can pick a different year via the dropdown before saving.
  const [selectedFiscalYearId, setSelectedFiscalYearId] = useState<number | null>(null);
  const loadedTransactionRef = useRef<string | null>(null);
  const loadedReceiptForRef = useRef<string | null>(null);
  // Mirrors editingTransactionUlid but updates synchronously (state updates don't apply until
  // the next render) — ensureTransactionUlid needs the fresh id right after an awaited save.
  const editingTransactionUlidRef = useRef<string | null>(null);

  const receiptImage = useImageGroup("acc_vendor_transaction", "acc-vendor-transactions", "receipt");

  const { data: vendorsData, isLoading: vendorsLoading } = useQuery({
    queryKey: ["acc-vendors"],
    queryFn: () => apiFetch<{ data: Vendor[]; meta: Meta }>("/acc-vendors?per_page=100"),
  });

  const { data: settingsData } = useQuery({
    queryKey: ["settings"],
    queryFn: () => apiFetch<{ data: { fiscal_year_id: number | null; fiscal_year: { ulid: string; name: string } | null } }>("/settings"),
  });

  const activeFiscalYearId = settingsData?.data?.fiscal_year_id ?? null;

  const { data: fiscalYearsData } = useQuery({
    queryKey: ["fiscal-years"],
    queryFn: () => apiFetch<{ data: FiscalYear[] }>("/fiscal-years"),
    staleTime: Infinity,
  });
  const fiscalYears = fiscalYearsData?.data ?? [];

  const vendors = vendorsData?.data ?? [];
  const filteredVendors = vendors.filter((v) => v.name.toLowerCase().includes(sideSearch.toLowerCase()));
  const selectedVendor = vendors.find((v) => v.ulid === selectedVendorUlid) ?? null;

  const { data: transactionsData } = useQuery({
    queryKey: ["acc-vendor-transactions", selectedVendor?.ulid],
    queryFn: () => apiFetch<{ data: SavedTransaction[] }>(`/acc-vendors/${selectedVendor!.ulid}/transactions`),
    enabled: !!selectedVendor && !!editTransactionParam,
  });

  useEffect(() => {
    if (!selectedVendorUlid && vendors.length > 0) setSelectedVendorUlid(vendors[0].ulid);
  }, [vendors]);

  // Starting a fresh payment whenever the vendor changes — previous vendor's draft doesn't carry over.
  useEffect(() => {
    if (editTransactionParam) return;
    resetForm();
  }, [selectedVendorUlid]);

  // Load the existing transaction into the form once, when editing via ?transaction=.
  useEffect(() => {
    if (!editTransactionParam || loadedTransactionRef.current === editTransactionParam) return;
    const tx = transactionsData?.data.find((t) => t.ulid === editTransactionParam);
    if (!tx) return;
    loadedTransactionRef.current = editTransactionParam;
    editingTransactionUlidRef.current = tx.ulid;
    setEditingTransactionUlid(tx.ulid);
    setSelectedFiscalYearId(tx.fiscal_year_id);
    setBillDate(tx.date);
    setBillNo(tx.voucher_no ?? "");
    setAmount(String(tx.debit ?? tx.credit ?? ""));
    setParticular(tx.particular);
    setChequeNo(tx.cheque_no ?? "");
  }, [editTransactionParam, transactionsData]);

  // Settings load asynchronously — default to the active fiscal year once it arrives,
  // as long as the user hasn't already picked something (or started editing a payment).
  useEffect(() => {
    if (selectedFiscalYearId === null && activeFiscalYearId !== null && !editingTransactionUlid) {
      setSelectedFiscalYearId(activeFiscalYearId);
    }
  }, [activeFiscalYearId, selectedFiscalYearId, editingTransactionUlid]);

  // Load whatever receipt photo is already attached once the transaction has an id
  // (either loaded for edit above, or just created by the first save below).
  useEffect(() => {
    if (!editingTransactionUlid) { receiptImage.reset(); loadedReceiptForRef.current = null; return; }
    if (loadedReceiptForRef.current === editingTransactionUlid) return;
    loadedReceiptForRef.current = editingTransactionUlid;
    receiptImage.load(editingTransactionUlid);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- receiptImage is a stable-shaped hook result, not a dep
  }, [editingTransactionUlid]);

  function selectVendor(ulid: string) {
    setSelectedVendorUlid(ulid);
    router.replace(`/admin/accounts/amount-paid?vendor=${ulid}`);
  }

  // Set once the current draft has been persisted (by auto-save or Save) — since there's no
  // endpoint to update a plain ledger entry, further blurs won't re-save (see tryAutoSave), so
  // this only exists to avoid firing a duplicate create. Fields stay editable either way.
  const [paymentSaved, setPaymentSaved] = useState(false);

  function resetForm() {
    setBillDate(getTodayBs());
    setBillNo("");
    setAmount("");
    setParticular("cash");
    setChequeNo("");
    setPaymentSaved(false);
    editingTransactionUlidRef.current = null;
    setEditingTransactionUlid(null);
    setSelectedFiscalYearId(activeFiscalYearId);
  }

  const savePaymentMutation = useMutation({
    mutationFn: (payload: object) =>
      apiFetch<{ data: { ulid: string } }>(`/acc-vendors/${selectedVendorUlid}/transactions`, { method: "POST", body: JSON.stringify(payload) }),
    onSuccess: (res) => {
      // Capture the created ulid so a receipt photo can be attached right after — further
      // blurs of this draft still only PATCH once `editingTransactionUlid` is set, same as edit mode.
      editingTransactionUlidRef.current = res.data.ulid;
      setEditingTransactionUlid(res.data.ulid);
      queryClient.invalidateQueries({ queryKey: ["acc-vendors"] });
      queryClient.invalidateQueries({ queryKey: ["acc-vendor-transactions", selectedVendorUlid] });
    },
    onError: (err: any) => toast.error("Failed to save payment", err?.message ?? "Something went wrong."),
  });

  const updatePaymentMutation = useMutation({
    mutationFn: (payload: object) =>
      apiFetch(`/acc-vendors/${selectedVendorUlid}/transactions/${editingTransactionUlid}`, { method: "PATCH", body: JSON.stringify(payload) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["acc-vendors"] });
      queryClient.invalidateQueries({ queryKey: ["acc-vendor-transactions", selectedVendorUlid] });
    },
    onError: (err: any) => toast.error("Failed to update payment", err?.message ?? "Something went wrong."),
  });

  function isFormReady(): boolean {
    if (!selectedVendorUlid) return false;
    if (!isValidBsDate(billDate)) return false;
    if (!particular) return false;
    if (!amount || Number(amount) <= 0) return false;
    return true;
  }

  // Clicking Save also blurs whichever field had focus, firing tryAutoSave at nearly the same
  // moment handleSave runs — both would otherwise start their own independent POST. Routing both
  // through this shared in-flight promise means the second caller awaits the first save instead
  // of firing a duplicate request.
  const saveInFlightRef = useRef<Promise<void> | null>(null);

  function savePayment(): Promise<void> {
    if (saveInFlightRef.current) return saveInFlightRef.current;
    if (!selectedVendorUlid) return Promise.resolve();

    const direction = getParticularDirection(particular);
    const payload = {
      date: billDate,
      particular,
      voucher_no: billNo || null,
      cheque_no: particular === "cheque" ? chequeNo : null,
      debit: direction === "debit" ? Number(amount) : null,
      credit: direction === "credit" ? Number(amount) : null,
      fiscal_year_id: selectedFiscalYearId ?? undefined,
    };

    const promise = (editingTransactionUlid
      ? updatePaymentMutation.mutateAsync(payload)
      : savePaymentMutation.mutateAsync(payload)
    )
      .then(() => {
        setPaymentSaved(true);
      })
      .finally(() => {
        saveInFlightRef.current = null;
      });

    saveInFlightRef.current = promise;
    return promise;
  }

  // Fires on blur of any field — silently no-ops until Date and Amount are filled in. When
  // editing an existing payment every blur re-saves; a fresh draft only saves once (see `paymentSaved`).
  function tryAutoSave() {
    if (paymentSaved && !editingTransactionUlid) return;
    if (!isFormReady()) return;
    savePayment().catch(() => {});
  }

  // Lets the receipt upload work even before the payment itself has been saved — fills in
  // the required fields first if needed, then returns the (possibly just-created) ulid.
  async function ensureTransactionUlid(): Promise<string | null> {
    if (editingTransactionUlidRef.current) return editingTransactionUlidRef.current;
    if (!isFormReady()) {
      toast.error("Fill in the payment first", "Date, particular and amount are required before attaching a receipt.");
      return null;
    }
    await savePayment();
    return editingTransactionUlidRef.current;
  }

  async function handleSave() {
    if (!selectedVendorUlid) return;
    if (paymentSaved) {
      toast.success("Payment saved", "The payment has been recorded.");
      router.push(selectedVendor ? `/admin/accounts?vendor=${selectedVendor.ulid}` : "/admin/accounts");
      return;
    }
    if (!isValidBsDate(billDate)) {
      toast.error("Invalid date", "Please enter a valid date.");
      return;
    }
    if (!amount || Number(amount) <= 0) {
      toast.error("Amount required", "Enter a valid amount to save.");
      return;
    }
    try {
      await savePayment();
      toast.success("Payment saved", "The payment has been recorded.");
      router.push(selectedVendor ? `/admin/accounts?vendor=${selectedVendor.ulid}` : "/admin/accounts");
    } catch {
      // error toast already shown by the mutation
    }
  }

  function handleCancel() {
    resetForm();
    router.push(selectedVendor ? `/admin/accounts?vendor=${selectedVendor.ulid}` : "/admin/accounts");
  }

  return (
    <div className="flex gap-0 transition-all duration-300 h-full">
      <div className="flex-1 min-w-0 flex flex-col p-6 gap-6 h-full">
        <nav className="flex items-center gap-1.5 text-sm text-text-muted">
          <Link href="/admin" className="hover:text-text-default transition-colors">Dashboard</Link>
          <span>/</span>
          <Link href="/admin/accounts" className="hover:text-text-default transition-colors">Accounts</Link>
          <span>/</span>
          <span className="text-text-default font-medium">{editTransactionParam ? "Edit Transaction" : "Amount Paid"}</span>
        </nav>

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-h3 font-bold text-text-default">{editTransactionParam ? "Edit Transaction" : "Amount Paid"}</h2>
            <p className="text-sm text-text-muted mt-0.5">{editTransactionParam ? "Update this ledger entry." : "Record a payment made to a vendor."}</p>
          </div>
          <div className="flex items-center shrink-0">
            <Link
              href={selectedVendor ? `/admin/accounts?vendor=${selectedVendor.ulid}` : "/admin/accounts"}
              className="flex items-center gap-2 bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-black/80 transition-colors cursor-pointer"
            >
              <ListOrdered className="h-4 w-4" />
              View Transactions
            </Link>
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 border border-slate-300 px-4 py-2 text-sm font-semibold text-text-default hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
          </div>
        </div>

        {/* Two-column body */}
        <div className="flex gap-6 flex-1 min-h-0">
          {/* Side card: vendor list */}
          <div className="w-80 shrink-0 flex flex-col h-full">
            <div className="flex items-center pb-3 shrink-0">
              <div className="relative flex-1">
                <Search className="absolute left-3 inset-y-0 my-auto h-3.5 w-3.5 text-text-muted pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={sideSearch}
                  onChange={(e) => setSideSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-sm border border-slate-400 focus:outline-none focus:border-slate-600"
                />
              </div>
            </div>

            <div className="flex flex-col flex-1 min-h-0 border border-slate-400 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 bg-black shrink-0">
                <span className="text-xs font-semibold text-white uppercase tracking-wide">Name</span>
                <span className="text-xs font-semibold text-white uppercase tracking-wide">Balance</span>
              </div>

              <div className="flex-1 overflow-y-auto">
                {vendorsLoading ? (
                  <p className="p-4 text-sm text-text-muted text-center">Loading...</p>
                ) : filteredVendors.length === 0 ? (
                  <p className="p-4 text-sm text-text-muted text-center">No vendors found.</p>
                ) : (
                  filteredVendors.map((vendor) => (
                    <div
                      key={vendor.ulid}
                      onClick={() => selectVendor(vendor.ulid)}
                      className={`flex items-center py-3.5 border-b border-slate-400 cursor-pointer transition-colors ${selectedVendor?.ulid === vendor.ulid ? "bg-slate-200 border-l-2 border-l-slate-700 pl-[14px] pr-1" : "pl-4 pr-1 hover:bg-slate-50"}`}
                    >
                      <span className={`text-sm truncate flex-1 min-w-0 ${selectedVendor?.ulid === vendor.ulid ? "font-semibold text-text-default" : "font-medium text-text-default"}`}>{vendor.name}</span>
                      <span className="text-sm font-semibold text-text-default text-right shrink-0">
                        {activeFiscalYearId && vendor.balances?.find((b) => b.fiscal_year_id === activeFiscalYearId)
                          ? Number(vendor.balances.find((b) => b.fiscal_year_id === activeFiscalYearId)!.remaining_balance).toLocaleString()
                          : "—"}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right side: detail card + payment content */}
          <div className="flex-1 min-w-0 flex flex-col gap-4 self-start">
            {/* Account detail card */}
            <div className="bg-white px-5 py-4 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-lg font-bold text-text-default leading-tight flex items-center gap-1.5">
                    {selectedVendor ? (
                      <>
                        <span className="text-base font-medium text-text-muted">Name:</span>
                        {selectedVendor.name}
                      </>
                    ) : (
                      <span className="text-text-muted font-normal text-sm">Select a vendor</span>
                    )}
                  </p>
                  {selectedVendor && (
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      {selectedVendor.address && (
                        <div className="flex items-center gap-1 text-text-body text-sm-custom">
                          <MapPin className="h-3.5 w-3.5 shrink-0" />
                          <span className="font-medium text-text-muted">Address:</span>
                          <span>{selectedVendor.address}</span>
                        </div>
                      )}
                      {(selectedVendor.phone || selectedVendor.telephone) && (
                        <>
                          <span className="text-slate-300">|</span>
                          <div className="flex items-center gap-1 text-text-body text-sm-custom">
                            <Phone className="h-3.5 w-3.5 shrink-0" />
                            <span className="font-medium text-text-muted">Phone:</span>
                            <span>{[selectedVendor.phone, selectedVendor.telephone].filter(Boolean).join(" / ")}</span>
                          </div>
                        </>
                      )}
                      {selectedVendor.vat_no && (
                        <>
                          <span className="text-slate-300">|</span>
                          <div className="flex items-center gap-1 text-text-body text-sm-custom">
                            <Receipt className="h-3.5 w-3.5 shrink-0" />
                            <span>VAT No: {selectedVendor.vat_no}</span>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {fiscalYears.length > 0 && (
                  <div className="flex flex-col gap-2 shrink-0 w-48">
                    <select
                      value={selectedFiscalYearId ?? ""}
                      onChange={(e) => setSelectedFiscalYearId(Number(e.target.value))}
                      disabled={!!editingTransactionUlid}
                      title={editingTransactionUlid ? "Fiscal year is locked once the payment is saved" : "Fiscal year this payment is recorded against"}
                      className="w-full h-8 px-2 text-sm font-medium text-black border border-slate-300 focus:outline-none focus:border-slate-500 bg-white disabled:bg-slate-100 disabled:text-text-muted"
                    >
                      {fiscalYears.map((fy) => (
                        <option key={fy.id} value={fy.id}>
                          {fy.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Transaction form */}
            <div className="border border-slate-300 bg-white p-6">
              <div className={`grid ${particular === "cheque" ? "grid-cols-5" : "grid-cols-4"} gap-4`}>
                <div>
                  <label className="block text-xs font-semibold text-text-default uppercase tracking-wide mb-1.5">Date</label>
                  <BsDateInput value={billDate} onChange={setBillDate} onBlur={tryAutoSave} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-default uppercase tracking-wide mb-1.5">Bill No</label>
                  <input
                    type="text"
                    value={billNo}
                    onChange={(e) => setBillNo(e.target.value)}
                    onBlur={tryAutoSave}
                    placeholder="Bill no..."
                    className="w-full h-8 px-2 text-sm font-medium text-black border border-slate-300 focus:outline-none focus:border-slate-500 bg-white disabled:bg-slate-100 disabled:text-text-muted"
                  />
                </div>
                <div className="[&_select]:h-8 [&_select]:text-sm [&_select]:font-medium [&_select]:text-black [&_.mt-1]:mt-0">
                  <SelectField
                    label="Particular"
                    value={particular}
                    onChange={(e) => {
                      const value = e.target.value;
                      setParticular(value);
                      if (value !== "cheque") setChequeNo("");
                      tryAutoSave();
                    }}
                    options={TRANSACTION_PARTICULARS.map((p) => ({ label: p.label, value: p.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-default uppercase tracking-wide mb-1.5">
                    Amount <span className="normal-case text-text-muted">({getParticularDirection(particular) === "debit" ? "Debit" : "Credit"})</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    onBlur={tryAutoSave}
                    placeholder="0.00"
                    className="w-full h-8 px-2 text-sm font-medium text-black border border-slate-300 focus:outline-none focus:border-slate-500 bg-white disabled:bg-slate-100 disabled:text-text-muted"
                  />
                </div>
                {particular === "cheque" && (
                  <div>
                    <label className="block text-xs font-semibold text-text-default uppercase tracking-wide mb-1.5">Cheque No</label>
                    <input
                      type="text"
                      value={chequeNo}
                      onChange={(e) => setChequeNo(e.target.value)}
                      onBlur={tryAutoSave}
                      placeholder="Cheque no..."
                      className="w-full h-8 px-2 text-sm font-medium text-black border border-slate-300 focus:outline-none focus:border-slate-500 bg-white disabled:bg-slate-100 disabled:text-text-muted"
                    />
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 max-w-xs">
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

              <div className="flex items-center justify-end mt-6 pt-4 border-t border-slate-100">
                <button
                  onClick={handleCancel}
                  className="px-6 py-2 text-sm font-semibold text-text-default border border-slate-300 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={savePaymentMutation.isPending}
                  className="px-6 py-2 text-sm font-semibold text-white bg-black hover:bg-black/80 disabled:opacity-60 transition-colors cursor-pointer"
                >
                  {savePaymentMutation.isPending ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AmountPaidPage() {
  return (
    <Suspense fallback={null}>
      <AmountPaidContent />
    </Suspense>
  );
}
