"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MapPin, Phone, Receipt, Search, ArrowLeft, ListOrdered } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { toast } from "@/lib/toast";
import { BsDateInput, getTodayBs, isValidBsDate } from "@/components/ui/form/BsDateInput";
import { SelectField } from "@/components/ui/form/FormField";

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "cheque", label: "Cheque" },
] as const;

type PaymentMethod = (typeof PAYMENT_METHODS)[number]["value"];

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

function AmountPaidContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const vendorParam = searchParams.get("vendor");
  const queryClient = useQueryClient();

  const [sideSearch, setSideSearch] = useState("");
  const [selectedVendorUlid, setSelectedVendorUlid] = useState<string | null>(vendorParam);
  const [billDate, setBillDate] = useState(getTodayBs);
  const [billNo, setBillNo] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [chequeNo, setChequeNo] = useState("");

  const { data: vendorsData, isLoading: vendorsLoading } = useQuery({
    queryKey: ["acc-vendors"],
    queryFn: () => apiFetch<{ data: Vendor[]; meta: Meta }>("/acc-vendors?per_page=100"),
  });

  const { data: settingsData } = useQuery({
    queryKey: ["settings"],
    queryFn: () => apiFetch<{ data: { fiscal_year_id: number | null; fiscal_year: { ulid: string; name: string } | null } }>("/settings"),
  });

  const activeFiscalYearId = settingsData?.data?.fiscal_year_id ?? null;

  const vendors = vendorsData?.data ?? [];
  const filteredVendors = vendors.filter((v) => v.name.toLowerCase().includes(sideSearch.toLowerCase()));
  const selectedVendor = vendors.find((v) => v.ulid === selectedVendorUlid) ?? null;

  useEffect(() => {
    if (!selectedVendorUlid && vendors.length > 0) setSelectedVendorUlid(vendors[0].ulid);
  }, [vendors]);

  // Starting a fresh payment whenever the vendor changes — previous vendor's draft doesn't carry over.
  useEffect(() => {
    resetForm();
  }, [selectedVendorUlid]);

  function selectVendor(ulid: string) {
    setSelectedVendorUlid(ulid);
    router.replace(`/admin/accounts/amount-paid?vendor=${ulid}`);
  }

  // Set once the current draft has been persisted (by auto-save or Save) — since there's no
  // endpoint to update a plain ledger entry, further field edits are locked to avoid either
  // silently losing them or creating duplicate transactions on every blur.
  const [paymentSaved, setPaymentSaved] = useState(false);

  function resetForm() {
    setBillDate(getTodayBs());
    setBillNo("");
    setAmount("");
    setPaymentMethod("cash");
    setChequeNo("");
    setPaymentSaved(false);
  }

  const savePaymentMutation = useMutation({
    mutationFn: (payload: object) =>
      apiFetch(`/acc-vendors/${selectedVendorUlid}/transactions`, { method: "POST", body: JSON.stringify(payload) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["acc-vendors"] });
      queryClient.invalidateQueries({ queryKey: ["acc-vendor-transactions", selectedVendorUlid] });
    },
    onError: (err: any) => toast.error("Failed to save payment", err?.message ?? "Something went wrong."),
  });

  function isFormReady(): boolean {
    if (!selectedVendorUlid) return false;
    if (!isValidBsDate(billDate)) return false;
    if (!amount || Number(amount) <= 0) return false;
    return true;
  }

  async function savePayment() {
    if (!selectedVendorUlid) return;
    await savePaymentMutation.mutateAsync({
      date: billDate,
      particular: paymentMethod,
      voucher_no: billNo || null,
      cheque_no: paymentMethod === "cheque" ? chequeNo : null,
      debit: Number(amount),
    });
    setPaymentSaved(true);
  }

  // Fires on blur of any field — silently no-ops until Date and Amount are filled in, and only
  // saves once per draft (no success toast, form stays as-is — see `paymentSaved`).
  function tryAutoSave() {
    if (paymentSaved || savePaymentMutation.isPending) return;
    if (!isFormReady()) return;
    savePayment().catch(() => {});
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
          <span className="text-text-default font-medium">Amount Paid</span>
        </nav>

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-h3 font-bold text-text-default">Amount Paid</h2>
            <p className="text-sm text-text-muted mt-0.5">Record a payment made to a vendor.</p>
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
              </div>
            </div>

            {/* Payment form */}
            <div className="border border-slate-300 bg-white p-6">
              <div className="grid grid-cols-5 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-text-default uppercase tracking-wide mb-1.5">Date</label>
                  <BsDateInput value={billDate} onChange={setBillDate} onBlur={tryAutoSave} disabled={paymentSaved} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-default uppercase tracking-wide mb-1.5">Bill No</label>
                  <input
                    type="text"
                    value={billNo}
                    onChange={(e) => setBillNo(e.target.value)}
                    onBlur={tryAutoSave}
                    disabled={paymentSaved}
                    placeholder="Bill no..."
                    className="w-full h-8 px-2 text-sm font-medium text-black border border-slate-300 focus:outline-none focus:border-slate-500 bg-white disabled:bg-slate-100 disabled:text-text-muted"
                  />
                </div>
                <div className="[&_select]:h-8 [&_select]:text-sm [&_select]:font-medium [&_select]:text-black [&_.mt-1]:mt-0">
                  <SelectField
                    label="Method"
                    value={paymentMethod}
                    disabled={paymentSaved}
                    onChange={(e) => {
                      const method = e.target.value as PaymentMethod;
                      setPaymentMethod(method);
                      if (method === "cash") setChequeNo("");
                      tryAutoSave();
                    }}
                    options={PAYMENT_METHODS.map((m) => ({ label: m.label, value: m.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-default uppercase tracking-wide mb-1.5">Amount</label>
                  <input
                    type="number"
                    min="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    onBlur={tryAutoSave}
                    disabled={paymentSaved}
                    placeholder="0.00"
                    className="w-full h-8 px-2 text-sm font-medium text-black border border-slate-300 focus:outline-none focus:border-slate-500 bg-white disabled:bg-slate-100 disabled:text-text-muted [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-default uppercase tracking-wide mb-1.5">Cheque No</label>
                  <input
                    type="text"
                    value={chequeNo}
                    onChange={(e) => setChequeNo(e.target.value)}
                    onBlur={tryAutoSave}
                    disabled={paymentSaved}
                    placeholder="Cheque no..."
                    className="w-full h-8 px-2 text-sm font-medium text-black border border-slate-300 focus:outline-none focus:border-slate-500 bg-white disabled:bg-slate-100 disabled:text-text-muted"
                  />
                </div>
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
