"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ListOrdered, Plus } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { toast } from "@/lib/toast";
import { BsDateInput, getTodayBs, isValidBsDate } from "@/components/ui/form/BsDateInput";
import { SelectField } from "@/components/ui/form/FormField";
import { TRANSACTION_PARTICULARS, getParticularDirection } from "../constants";
import { MultiImageUpload } from "@/components/ui/form/MultiImageUpload";
import { useImageGroup } from "@/hooks/useImageGroup";
import { CustomerSidebar } from "../_components/CustomerSidebar";
import { CustomerInfoBlock } from "../_components/CustomerInfoBlock";
import { Customer } from "../_components/types";
import { CustomerFormPanel, CustomerFormState, CustomerFormErrors } from "../_components/CustomerFormPanel";
import { TrashedCustomersModal } from "../_components/TrashedCustomersModal";
import { useViewingFiscalYear } from "@/features/fiscal-year/ViewingFiscalYearProvider";

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
  sort_order: number;
};

function AmountReceivedContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const customerParam = searchParams.get("customer");
  const editTransactionParam = searchParams.get("transaction");
  const queryClient = useQueryClient();

  const [sideSearch, setSideSearch] = useState("");
  const [selectedCustomerUlid, setSelectedCustomerUlid] = useState<string | null>(customerParam);
  const [billDate, setBillDate] = useState(getTodayBs);
  const [billNo, setBillNo] = useState("");
  const [amount, setAmount] = useState("");
  const [particular, setParticular] = useState<string>("cash");
  const [chequeNo, setChequeNo] = useState("");
  const [editingTransactionUlid, setEditingTransactionUlid] = useState<string | null>(null);
  // Which fiscal year this receipt is recorded against — defaults to the tenant's active
  // one once it loads, but the user can pick a different year via the dropdown before saving.
  const [selectedFiscalYearId, setSelectedFiscalYearId] = useState<number | null>(null);
  const loadedTransactionRef = useRef<string | null>(null);
  const loadedReceiptForRef = useRef<string | null>(null);
  // Mirrors editingTransactionUlid but updates synchronously (state updates don't apply until
  // the next render) — ensureTransactionUlid needs the fresh id right after an awaited save.
  const editingTransactionUlidRef = useRef<string | null>(null);

  const receiptImage = useImageGroup("acc_customer_transaction", "acc-customer-transactions", "receipt");

  const { data: customersData, isLoading: customersLoading } = useQuery({
    queryKey: ["acc-customers"],
    queryFn: () => apiFetch<{ data: Customer[]; meta: Meta }>("/acc-customers?per_page=100"),
  });

  // Named activeFiscalYearId below for a smaller diff, but this is actually the header's
  // viewing fiscal year (see ViewingFiscalYearProvider) — may differ from the tenant's real
  // active year in Settings.
  const { viewingFiscalYearId: activeFiscalYearId } = useViewingFiscalYear();

  const { data: fiscalYearsData } = useQuery({
    queryKey: ["fiscal-years"],
    queryFn: () => apiFetch<{ data: FiscalYear[] }>("/fiscal-years"),
    staleTime: Infinity,
  });
  const fiscalYears = fiscalYearsData?.data ?? [];

  const CUSTOMER_INITIAL_FORM: CustomerFormState = { name: "", address: "", phone: "", telephone: "", vat_no: "", fiscal_year_id: "", opening_balance: "" };
  const [customerPanelOpen, setCustomerPanelOpen] = useState(false);
  const [customerForm, setCustomerForm] = useState<CustomerFormState>(CUSTOMER_INITIAL_FORM);
  const [customerErrors, setCustomerErrors] = useState<CustomerFormErrors>({});
  const [trashedCustomersOpen, setTrashedCustomersOpen] = useState(false);

  const { data: trashedCustomersData, isLoading: trashedCustomersLoading } = useQuery({
    queryKey: ["acc-customers-trashed"],
    queryFn: () => apiFetch<{ data: Customer[] }>("/acc-customers/trashed"),
    enabled: trashedCustomersOpen,
  });
  const trashedCustomers = trashedCustomersData?.data ?? [];

  const restoreCustomerMutation = useMutation({
    mutationFn: (customerUlid: string) => apiFetch(`/acc-customers/${customerUlid}/restore`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["acc-customers"] });
      queryClient.invalidateQueries({ queryKey: ["acc-customers-trashed"] });
      toast.success("Customer restored", "The customer is back in the list.");
    },
    onError: () => toast.error("Failed to restore", "Something went wrong."),
  });

  const createCustomerMutation = useMutation({
    mutationFn: (payload: { name: string; address: string | null; phone: string | null; telephone: string | null; vat_no: string | null }) =>
      apiFetch<{ data: Customer }>("/acc-customers", { method: "POST", body: JSON.stringify(payload) }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["acc-customers"] });
      toast.success("Customer created", `"${res.data.name}" has been added.`);
      setCustomerPanelOpen(false);
      setCustomerForm(CUSTOMER_INITIAL_FORM);
      selectCustomer(res.data.ulid);
    },
    onError: (err: any) => {
      if (err?.errors) {
        setCustomerErrors(err.errors);
        toast.warning("Please fix the errors", "Check the highlighted fields.");
      } else {
        toast.error("Failed to create customer", err?.message ?? "Something went wrong.");
      }
    },
  });

  function submitCustomerForm() {
    if (!customerForm.name.trim()) { setCustomerErrors({ name: "Name is required." }); return; }
    createCustomerMutation.mutate({
      name: customerForm.name,
      address: customerForm.address || null,
      phone: customerForm.phone || null,
      telephone: customerForm.telephone || null,
      vat_no: customerForm.vat_no || null,
    });
  }

  const customers = customersData?.data ?? [];
  const selectedCustomer = customers.find((c) => c.ulid === selectedCustomerUlid) ?? null;

  const { data: transactionsData } = useQuery({
    queryKey: ["acc-customer-transactions", selectedCustomer?.ulid],
    queryFn: () => apiFetch<{ data: SavedTransaction[] }>(`/acc-customers/${selectedCustomer!.ulid}/transactions`),
    enabled: !!selectedCustomer && !!editTransactionParam,
  });

  useEffect(() => {
    if (!selectedCustomerUlid && customers.length > 0) setSelectedCustomerUlid(customers[0].ulid);
  }, [customers]);

  // Reacting to the customer selection changing. First pick (prev === null) leaves whatever was
  // already typed alone and tries to save it (autosave couldn't fire without a customer yet);
  // swapping to a *different* already-selected customer starts a fresh receipt instead, since that
  // customer's draft doesn't carry over.
  const prevCustomerUlidRef = useRef<string | null>(null);
  useEffect(() => {
    const prev = prevCustomerUlidRef.current;
    prevCustomerUlidRef.current = selectedCustomerUlid;
    if (editTransactionParam || prev === selectedCustomerUlid) return;
    if (!prev) { tryAutoSave(); return; }
    resetForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to the customer selection changing
  }, [selectedCustomerUlid]);

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
  // as long as the user hasn't already picked something (or started editing a receipt).
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

  function selectCustomer(ulid: string) {
    setSelectedCustomerUlid(ulid);
    router.replace(`/admin/customers/amount-received?customer=${ulid}`);
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
      apiFetch<{ data: { ulid: string } }>(`/acc-customers/${selectedCustomerUlid}/transactions`, { method: "POST", body: JSON.stringify(payload) }),
    onSuccess: (res) => {
      // Capture the created ulid so a receipt photo can be attached right after — further
      // blurs of this draft still only PATCH once `editingTransactionUlid` is set, same as edit mode.
      editingTransactionUlidRef.current = res.data.ulid;
      setEditingTransactionUlid(res.data.ulid);
      queryClient.invalidateQueries({ queryKey: ["acc-customers"] });
      queryClient.invalidateQueries({ queryKey: ["acc-customer-transactions", selectedCustomerUlid] });
    },
    onError: (err: any) => toast.error("Failed to save payment", err?.message ?? "Something went wrong."),
  });

  const updatePaymentMutation = useMutation({
    mutationFn: (payload: object) =>
      apiFetch(`/acc-customers/${selectedCustomerUlid}/transactions/${editingTransactionUlid}`, { method: "PATCH", body: JSON.stringify(payload) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["acc-customers"] });
      queryClient.invalidateQueries({ queryKey: ["acc-customer-transactions", selectedCustomerUlid] });
    },
    onError: (err: any) => toast.error("Failed to update payment", err?.message ?? "Something went wrong."),
  });

  function isFormReady(): boolean {
    if (!selectedCustomerUlid) return false;
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
    if (!selectedCustomerUlid) return Promise.resolve();

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
  // editing an existing receipt every blur re-saves; a fresh draft only saves once (see `paymentSaved`).
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
    if (!selectedCustomerUlid) return;
    if (paymentSaved) {
      toast.success("Payment saved", "The payment has been recorded.");
      router.push(selectedCustomer ? `/admin/customers?customer=${selectedCustomer.ulid}` : "/admin/customers");
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
      router.push(selectedCustomer ? `/admin/customers?customer=${selectedCustomer.ulid}` : "/admin/customers");
    } catch {
      // error toast already shown by the mutation
    }
  }

  function handleCancel() {
    resetForm();
    router.push(selectedCustomer ? `/admin/customers?customer=${selectedCustomer.ulid}` : "/admin/customers");
  }

  return (
    <div className="flex gap-0 transition-all duration-300 h-full">
      <div className="flex-1 min-w-0 flex flex-col p-6 gap-6 h-full">
        <nav className="flex items-center gap-1.5 text-sm text-text-muted">
          <Link href="/admin" className="hover:text-text-default transition-colors">Dashboard</Link>
          <span>/</span>
          <Link href="/admin/customers" className="hover:text-text-default transition-colors">Customers</Link>
          <span>/</span>
          <span className="text-text-default font-medium">{editTransactionParam ? "Edit Transaction" : "Amount Received"}</span>
        </nav>

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-h3 font-bold text-text-default">{editTransactionParam ? "Edit Transaction" : "Amount Received"}</h2>
            <p className="text-sm text-text-muted mt-0.5">{editTransactionParam ? "Update this ledger entry." : "Record a payment received from a customer."}</p>
          </div>
          <div className="flex items-center shrink-0">
            <Link
              href={selectedCustomer ? `/admin/customers?customer=${selectedCustomer.ulid}` : "/admin/customers"}
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
          {/* Side card: customer list */}
          <CustomerSidebar
            customers={customers}
            customersLoading={customersLoading}
            activeFiscalYearId={activeFiscalYearId}
            selectedCustomerUlid={selectedCustomer?.ulid}
            search={sideSearch}
            onSearchChange={setSideSearch}
            onSelect={(customer) => selectCustomer(customer.ulid)}
            onTrashClick={() => setTrashedCustomersOpen(true)}
            headerRight={
              <button
                type="button"
                onClick={() => {
                  setCustomerForm({ ...CUSTOMER_INITIAL_FORM, fiscal_year_id: activeFiscalYearId ? String(activeFiscalYearId) : "" });
                  setCustomerErrors({});
                  setCustomerPanelOpen(true);
                }}
                className="flex items-center gap-1.5 h-9 bg-black px-3 text-h4 font-semibold text-white hover:bg-black/80 transition-colors shrink-0 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                Add
              </button>
            }
          />

          {/* Right side: detail card + payment content */}
          <div className="flex-1 min-w-0 flex flex-col gap-4 self-start">
            {/* Account detail card */}
            <div className="bg-white px-5 py-4 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <CustomerInfoBlock customer={selectedCustomer} />

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

      <CustomerFormPanel
        open={customerPanelOpen}
        onClose={() => setCustomerPanelOpen(false)}
        isEditing={false}
        saving={createCustomerMutation.isPending}
        form={customerForm}
        errors={customerErrors}
        fiscalYears={fiscalYears}
        onFieldChange={(field, value) => {
          setCustomerForm((f) => ({ ...f, [field]: value }));
          if (field === "name") setCustomerErrors((prev) => ({ ...prev, name: undefined }));
        }}
        onFieldBlur={() => {}}
        onOpeningBalanceBlur={() => {}}
        onSubmit={submitCustomerForm}
      />

      <TrashedCustomersModal
        open={trashedCustomersOpen}
        onClose={() => setTrashedCustomersOpen(false)}
        loading={trashedCustomersLoading}
        customers={trashedCustomers}
        restoring={restoreCustomerMutation.isPending}
        onRestore={(customerUlid) => restoreCustomerMutation.mutate(customerUlid)}
      />
    </div>
  );
}

export default function AmountReceivedPage() {
  return (
    <Suspense fallback={null}>
      <AmountReceivedContent />
    </Suspense>
  );
}
