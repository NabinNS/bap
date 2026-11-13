"use client";

import { Suspense, useState, useEffect, useRef, useMemo, useReducer } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table/DataTable";
import { Plus, CreditCard, X, MoreVertical, Pencil, Eye, Trash2, Maximize2, Calendar, Filter as FilterIcon, RefreshCw, AlertTriangle, History } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { TRANSACTION_PARTICULARS, getParticularLabel } from "./constants";
import { toast } from "@/lib/toast";
import { SelectField, ComboboxField } from "@/components/ui/form/FormField";
import { SlidePanel } from "@/components/ui/form/SlidePanelForm";
import { BsDateInput, isValidBsDate } from "@/components/ui/form/BsDateInput";
import { ConfirmDialog } from "@/components/ui/dialog/ConfirmDialog";
import { BillEditPanel } from "@/components/transactions/BillEditPanel";
import { CustomerSidebar } from "./_components/CustomerSidebar";
import { CustomerInfoBlock } from "./_components/CustomerInfoBlock";
import { ActivityLogPanel } from "@/components/activity-log/ActivityLogPanel";

const ACTIVITY_LOG_SUBJECT_TYPE_LABELS: Record<string, string> = {
  acc_vendor: "Vendor",
  acc_customer: "Customer",
  acc_vendor_transaction: "Transaction",
  acc_customer_transaction: "Transaction",
  acc_vendor_transaction_item: "Item",
  acc_customer_transaction_item: "Item",
  acc_quotation: "Quotation",
  acc_quotation_item: "Item",
};
import { TrashedCustomersModal } from "./_components/TrashedCustomersModal";
import { FiscalYearModal } from "../accounts/_components/FiscalYearModal";
import { FilterModal } from "./_components/FilterModal";
import { TrashModal } from "./_components/TrashModal";
import { CustomerFormPanel, CustomerFormState, CustomerFormErrors } from "./_components/CustomerFormPanel";
import { useInvalidateCustomerTransactions } from "../accounts/_components/useAccountingInvalidation";
import { Customer, FiscalYear } from "./_components/types";
import { useViewingFiscalYear } from "@/features/fiscal-year/ViewingFiscalYearProvider";
import { hasDownstreamDrift } from "@/lib/fiscalYearDrift";

type Meta = {
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
  from: number;
  to: number;
};

type TransactionItem = {
  ulid: string;
  product_ulid: string;
  product_name: string;
  quantity: number;
  rate: number;
  amount: number;
  discount: number;
  total: number;
};

type Transaction = {
  ulid: string;
  date: string;
  particular: string;
  voucher_no: string | null;
  cheque_no?: string | null;
  type: string | null;
  debit: number | null;
  credit: number | null;
  discount_percent?: number | null;
  taxable_amount?: number | null;
  vat_amount?: number | null;
  grand_total?: number | null;
  vat_exempt?: boolean | null;
  items?: TransactionItem[];
};

type FormState = CustomerFormState;
type FormErrors = CustomerFormErrors;

const INITIAL_FORM: FormState = {
  name: "",
  address: "",
  phone: "",
  telephone: "",
  vat_no: "",
  fiscal_year_id: "",
  opening_balance: "",
};


const PARTICULAR_OPTIONS = TRANSACTION_PARTICULARS.map((p) => ({ value: p.value, label: p.label }));

function ParticularCombobox({ customerUlid, onChange }: { customerUlid: string; onChange: (val: string) => void }) {
  const [value, setValue] = useState("");
  return (
    <div className="absolute inset-0 [&_input]:!h-full [&_input]:!w-full [&_input]:!text-sm [&_input]:!font-medium [&_input]:!text-black [&_input]:!border-0 [&_input]:!ring-0 [&_input]:!shadow-none [&_input]:!bg-transparent [&_input]:!px-2 [&_input]:focus:!outline-none [&_input]:focus:!ring-0 [&_input]:focus:!border-0 [&_.mt-1]:mt-0">
      <ComboboxField
        key={customerUlid}
        label=""
        options={PARTICULAR_OPTIONS}
        value={value}
        onChange={(v) => { setValue(v); onChange(v); }}
        autoFocus
        fillHeight
      />
    </div>
  );
}

function AdminCustomersContent() {
  const queryClient = useQueryClient();
  const invalidateCustomerTransactions = useInvalidateCustomerTransactions();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sideSearch, setSideSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedCustomerUlid, setSelectedCustomerUlid] = useState<string | null>(searchParams.get("customer"));
  const [selectedTransactionUlid, setSelectedTransactionUlid] = useState<string | null>(null);
  const [openMenuUlid, setOpenMenuUlid] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [cardMenuOpen, setCardMenuOpen] = useState(false);
  const [cardMenuPos, setCardMenuPos] = useState<{ top: number; left: number } | null>(null);
  const cardMenuRef = useRef<HTMLDivElement>(null);
  const [activityLogOpen, setActivityLogOpen] = useState(false);
  const [activityLogCustomer, setActivityLogCustomer] = useState<Customer | null>(null);
  const [highlightedTransactionUlid, setHighlightedTransactionUlid] = useState<string | null>(null);
  const [txActivityLogOpen, setTxActivityLogOpen] = useState(false);
  const [txActivityLogTarget, setTxActivityLogTarget] = useState<{ ulid: string; label: string } | null>(null);
  const [txMenuUlid, setTxMenuUlid] = useState<string | null>(null);
  const [showFullDetails, setShowFullDetails] = useState(false);
  const [fiscalYearModalOpen, setFiscalYearModalOpen] = useState(false);
  const [trashModalOpen, setTrashModalOpen] = useState(false);
  const [trashedCustomersOpen, setTrashedCustomersOpen] = useState(false);
  const { viewingFiscalYearId, setViewingFiscalYearId } = useViewingFiscalYear();
  const [fiscalYearDraft, setFiscalYearDraft] = useState<string>("");
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [dateFromDraft, setDateFromDraft] = useState("");
  const [dateToDraft, setDateToDraft] = useState("");
  // BsDateInput only reads `value` on mount — bump this to force it to remount and pick up
  // an externally-cleared value (its own typed text otherwise never re-syncs from props).
  const [dateFilterResetKey, setDateFilterResetKey] = useState(0);
  const [confirmDeleteTxUlid, setConfirmDeleteTxUlid] = useState<string | null>(null);
  const [txMenuPos, setTxMenuPos] = useState<{ top: number; left: number } | null>(null);
  const txMenuRef = useRef<HTMLDivElement>(null);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const draftRef = useRef({ particular: "", voucher_no: "", debit: "", credit: "", date: "" });
  const [pendingCustomerUlid, setPendingCustomerUlid] = useState<string | null>(null);
  const [, forceUpdate] = useReducer((x: number) => x + 1, 0);
  const [editingOpeningBalance, setEditingOpeningBalance] = useState(false);
  const [openingBalanceDraft, setOpeningBalanceDraft] = useState("");
  const [openingBalanceFiscalYearId, setOpeningBalanceFiscalYearId] = useState("");

  const { data: customersData, isLoading: customersLoading } = useQuery({
    queryKey: ["acc-customers"],
    queryFn: () => apiFetch<{ data: Customer[]; meta: Meta }>("/acc-customers?per_page=100"),
  });

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

  const { data: fiscalYearsData } = useQuery({
    queryKey: ["fiscal-years"],
    queryFn: () => apiFetch<{ data: FiscalYear[] }>("/fiscal-years"),
    staleTime: Infinity,
  });

  const fiscalYears = fiscalYearsData?.data ?? [];

  // Accounts shows/records data for whichever fiscal year is selected in the header — not
  // necessarily the tenant's real active fiscal year (see ViewingFiscalYearProvider).
  const viewedFiscalYearId = viewingFiscalYearId;
  const viewedFiscalYear = fiscalYears.find((fy) => fy.id === viewingFiscalYearId) ?? null;

  const customers = customersData?.data ?? [];

  // Always derived from live query data so it updates automatically after mutations
  const selectedCustomer = customers.find((c) => c.ulid === selectedCustomerUlid) ?? null;

  const viewedBalance = viewedFiscalYearId && selectedCustomer
    ? selectedCustomer.balances?.find((b) => b.fiscal_year_id === viewedFiscalYearId) ?? null
    : null;
  const viewedOpeningBalance = viewedBalance?.opening_balance ?? null;
  const viewedRemainingBalance = viewedBalance?.remaining_balance ?? null;

  // Whether this customer's balance chain has drifted downstream from the viewed year — i.e.
  // a later year's opening_balance no longer matches the prior year's remaining_balance.
  // Drives whether "Sync Balance" is shown, instead of just comparing viewed vs. active year.
  const customerHasDrift = !!(selectedCustomer && viewedFiscalYearId && hasDownstreamDrift(
    (selectedCustomer.balances ?? []).map((b) => ({
      fiscal_year_id: b.fiscal_year_id,
      opening: Number(b.opening_balance),
      remaining: Number(b.remaining_balance),
    })),
    fiscalYears,
    viewedFiscalYearId,
  ));

  const { data: transactionsData, isLoading: transactionsLoading } = useQuery({
    queryKey: ["acc-customer-transactions", selectedCustomer?.ulid, viewedFiscalYearId],
    queryFn: () => apiFetch<{ data: Transaction[] }>(
      `/acc-customers/${selectedCustomer!.ulid}/transactions?per_page=1000${viewedFiscalYearId ? `&fiscal_year_id=${viewedFiscalYearId}` : ""}`
    ),
    enabled: !!selectedCustomer,
  });

  useEffect(() => {
    if (!selectedCustomerUlid && customers.length > 0) setSelectedCustomerUlid(customers[0].ulid);
  }, [customers]);

  useEffect(() => {
    draftRef.current = { particular: "", voucher_no: "", debit: "", credit: "", date: "" };
    setDateFrom("");
    setDateTo("");
  }, [selectedCustomerUlid]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) { setOpenMenuUlid(null); setMenuPos(null); }
    }
    if (openMenuUlid) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openMenuUlid]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (cardMenuRef.current && !cardMenuRef.current.contains(e.target as Node)) { setCardMenuOpen(false); setCardMenuPos(null); }
    }
    if (cardMenuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [cardMenuOpen]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (txMenuRef.current && !txMenuRef.current.contains(e.target as Node)) { setTxMenuUlid(null); setTxMenuPos(null); }
    }
    if (txMenuUlid) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [txMenuUlid]);

  const saveTransactionMutation = useMutation({
    mutationFn: ({ customerUlid, payload }: { customerUlid: string; payload: object }) =>
      apiFetch(`/acc-customers/${customerUlid}/transactions`, { method: "POST", body: JSON.stringify(payload) }),
    onSuccess: (_data, variables) => {
      queryClient.refetchQueries({ queryKey: ["acc-customer-transactions", variables.customerUlid] });
      invalidateCustomerTransactions(variables.customerUlid);
      draftRef.current = { particular: "", voucher_no: "", debit: "", credit: "", date: "" };
      forceUpdate();
      toast.success("Transaction saved", "Entry has been recorded.");
    },
    onError: () => toast.error("Failed to save", "Could not save the transaction."),
  });

  const deleteTransactionMutation = useMutation({
    mutationFn: ({ customerUlid, txUlid }: { customerUlid: string; txUlid: string }) =>
      apiFetch(`/acc-customers/${customerUlid}/transactions/${txUlid}`, { method: "DELETE" }),
    onSuccess: (_data, variables) => {
      // Deleting a whole bill reverses every item's stock contribution too (see
      // DeleteAccCustomerTransactionAction) — the full invalidation set covers that.
      invalidateCustomerTransactions(variables.customerUlid);
      toast.success("Transaction deleted", "The transaction has been removed.");
    },
    onError: (err: any) => toast.error("Failed to delete transaction", err?.message ?? "Something went wrong."),
  });

  const { data: trashedData, isLoading: trashedLoading } = useQuery({
    queryKey: ["acc-customer-transactions-trashed", selectedCustomer?.ulid, viewedFiscalYearId],
    queryFn: () => apiFetch<{ data: Transaction[] }>(
      `/acc-customers/${selectedCustomer!.ulid}/transactions/trashed${viewedFiscalYearId ? `?fiscal_year_id=${viewedFiscalYearId}` : ""}`
    ),
    enabled: !!selectedCustomer && trashModalOpen,
  });
  const trashedTransactions = trashedData?.data ?? [];

  const restoreTransactionMutation = useMutation({
    mutationFn: ({ customerUlid, txUlid }: { customerUlid: string; txUlid: string }) =>
      apiFetch(`/acc-customers/${customerUlid}/transactions/${txUlid}/restore`, { method: "POST" }),
    onSuccess: (_data, variables) => {
      // Restoring a whole bill re-applies every item's stock contribution too (see
      // RestoreAccCustomerTransactionAction) — the full invalidation set covers that.
      invalidateCustomerTransactions(variables.customerUlid);
      queryClient.invalidateQueries({ queryKey: ["acc-customer-transactions-trashed", variables.customerUlid] });
      toast.success("Transaction restored", "The transaction is back in the ledger.");
    },
    onError: (err: any) => toast.error("Failed to restore transaction", err?.message ?? "Something went wrong."),
  });

  function tryAutoSaveTransaction() {
    if (!selectedCustomerUlid) return;
    const { particular, debit, credit } = draftRef.current;
    const date = draftRef.current.date;
    if (!isValidBsDate(date) || !particular.trim() || (!debit && !credit)) return;
    saveTransactionMutation.mutate({
      customerUlid: selectedCustomerUlid,
      payload: {
        date,
        particular: particular.trim(),
        voucher_no: draftRef.current.voucher_no || null,
        debit: debit ? parseFloat(debit) : null,
        credit: credit ? parseFloat(credit) : null,
        fiscal_year_id: viewingFiscalYearId,
      },
    });
  }

  const saveBalanceMutation = useMutation({
    mutationFn: ({ ulid, opening_balance, fiscal_year_id }: { ulid: string; opening_balance: string; fiscal_year_id?: string }) =>
      apiFetch(`/acc-customers/${ulid}/balance`, {
        method: "POST",
        body: JSON.stringify({
          opening_balance: parseFloat(opening_balance),
          fiscal_year_id: fiscal_year_id ? parseInt(fiscal_year_id) : undefined,
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["acc-customers"] });
    },
    onError: () => {
      toast.warning("Customer saved", "But opening balance could not be saved — check if active fiscal year is set in Settings.");
    },
  });

  const syncBalanceMutation = useMutation({
    mutationFn: ({ ulid, fiscal_year_id }: { ulid: string; fiscal_year_id: number }) =>
      apiFetch(`/acc-customers/${ulid}/balance/sync`, {
        method: "POST",
        body: JSON.stringify({ fiscal_year_id }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["acc-customers"] });
      toast.success("Balance synced", "This customer's balance has been recalculated forward through later fiscal years.");
    },
    onError: (err: any) => toast.error("Failed to sync", err?.message ?? "Something went wrong."),
  });

  const saveMutation = useMutation({
    mutationFn: ({ ulid, payload }: { ulid?: string; payload: ReturnType<typeof buildPayload> }) =>
      ulid
        ? apiFetch(`/acc-customers/${ulid}`, { method: "PUT", body: JSON.stringify(payload) })
        : apiFetch<{ data: Customer }>("/acc-customers", { method: "POST", body: JSON.stringify(payload) }),
    onSuccess: async (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["acc-customers"] });
      const customer = variables.ulid ? editingCustomer : (data as { data: Customer }).data;
      if (!variables.ulid) setEditingCustomer((data as { data: Customer }).data);

      if (customer && form.opening_balance) {
        await saveBalanceMutation.mutateAsync({ ulid: customer.ulid, opening_balance: form.opening_balance, fiscal_year_id: form.fiscal_year_id });
      }

      if (!variables.ulid) {
        toast.success("Customer created", `"${form.name}" has been added.`);
        if (customer) setSelectedCustomerUlid(customer.ulid);
        closeDrawer();
      } else {
        toast.success("Customer updated", `"${form.name}" has been updated.`);
        closeDrawer();
      }
    },
    onError: (err: any) => {
      if (err?.errors) {
        setErrors(err.errors);
        toast.warning("Please fix the errors", "Check the highlighted fields.");
      } else {
        toast.error(
          editingCustomer ? "Failed to update customer" : "Failed to create customer",
          err?.message ?? "Something went wrong."
        );
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (ulid: string) => apiFetch(`/acc-customers/${ulid}`, { method: "DELETE" }),
    onSuccess: (_, ulid) => {
      queryClient.invalidateQueries({ queryKey: ["acc-customers"] });
      if (selectedCustomer?.ulid === ulid) setSelectedCustomerUlid(null);
      toast.success("Customer deleted", "The customer has been removed.");
    },
    onError: () => toast.error("Failed to delete", "Something went wrong."),
  });

  function openEdit(customer: Customer) {
    setEditingCustomer(customer);
    setForm({
      name: customer.name,
      address: customer.address ?? "",
      phone: customer.phone ?? "",
      telephone: customer.telephone ?? "",
      vat_no: customer.vat_no ?? "",
      fiscal_year_id: viewingFiscalYearId ? String(viewingFiscalYearId) : "",
      opening_balance: customer.balances?.find((b) => b.fiscal_year_id === viewingFiscalYearId)?.opening_balance ?? "",
    });
    setErrors({});
    setDrawerOpen(true);
    setOpenMenuUlid(null);
  }

  function openCreate() {
    setEditingCustomer(null);
    setForm({ ...INITIAL_FORM, fiscal_year_id: viewingFiscalYearId ? String(viewingFiscalYearId) : "" });
    setErrors({});
    setDrawerOpen(true);
  }

  function closeDrawer() {
    setDrawerOpen(false);
    setEditingCustomer(null);
    setForm(INITIAL_FORM);
    setErrors({});
  }

  function buildPayload(f: FormState) {
    return {
      name: f.name,
      address: f.address || null,
      phone: f.phone || null,
      telephone: f.telephone || null,
      vat_no: f.vat_no || null,
    };
  }

  function validate(): boolean {
    const errs: FormErrors = {};
    if (!form.name.trim()) errs.name = "Name is required.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    saveMutation.mutate({ ulid: editingCustomer?.ulid, payload: buildPayload(form) });
  }

  const rawTransactions = transactionsData?.data ?? [];

  // BS dates are zero-padded "YYYY-MM-DD" strings, so lexicographic comparison sorts correctly.
  const dateFilteredTransactions = (dateFrom || dateTo)
    ? rawTransactions.filter((t) => (!dateFrom || t.date >= dateFrom) && (!dateTo || t.date <= dateTo))
    : rawTransactions;

  const SALES_PARTICULARS = ["sales", "sales_non_vat"];
  const PAYMENT_PARTICULARS = ["cash", "cheque"];

  const totalSales = dateFilteredTransactions
    .filter((t) => SALES_PARTICULARS.includes(t.particular))
    .reduce((sum, t) => sum + Number(t.credit ?? 0), 0);

  const totalReceived = dateFilteredTransactions
    .filter((t) => PAYMENT_PARTICULARS.includes(t.particular))
    .reduce((sum, t) => sum + Number(t.debit ?? 0), 0);

  const lastTransactionDate = dateFilteredTransactions.reduce<string | null>(
    (latest, t) => (!latest || t.date > latest ? t.date : latest),
    null
  );

  function fiscalYearStartDate(name: string): string {
    // name like "2080/081" or "080/081" — start year is the first part
    const match = name.match(/(\d+)/);
    if (!match) return name;
    const year = match[1].length === 4 ? match[1].slice(1) : match[1]; // keep last 3 digits
    return `${year}-4-1`;
  }

  const openingBalanceRow: Transaction | null = viewedBalance?.opening_balance != null
    ? {
      ulid: "__opening_balance__",
      date: viewedFiscalYear ? fiscalYearStartDate(viewedFiscalYear.name) : "Opening",
      particular: "Opening Balance",
      voucher_no: null,
      type: "Opening",
      debit: null,
      credit: Number(viewedBalance.opening_balance),
    }
    : null;

  const draftBsDate = draftRef.current.date;

  const draftTransaction: Transaction = {
    ulid: "__new__",
    date: draftBsDate,
    particular: draftRef.current.particular,
    voucher_no: draftRef.current.voucher_no || null,
    type: null,
    debit: draftRef.current.debit ? Number(draftRef.current.debit) : null,
    credit: draftRef.current.credit ? Number(draftRef.current.credit) : null,
  };

  const transactions = [
    ...(openingBalanceRow ? [openingBalanceRow, ...dateFilteredTransactions] : dateFilteredTransactions),
    draftTransaction,
  ];

  function draftHasContent(): boolean {
    const d = draftRef.current;
    return !!(d.particular || d.voucher_no || d.debit || d.credit);
  }

  function selectCustomerNow(ulid: string) {
    setSelectedCustomerUlid(ulid);
    setSelectedTransactionUlid(null);
    setEditingOpeningBalance(false);
    setOpenMenuUlid(null);
  }

  // Switching customers resets the quick-add draft row (see the effect keyed on
  // selectedCustomerUlid) — confirm first if the user has actually typed something into it.
  function trySwitchCustomer(ulid: string) {
    if (ulid === selectedCustomerUlid) { setOpenMenuUlid(null); return; }
    if (draftHasContent()) {
      setPendingCustomerUlid(ulid);
      return;
    }
    selectCustomerNow(ulid);
  }

  function removeTransaction(txUlid: string) {
    if (!selectedCustomerUlid) return;
    setConfirmDeleteTxUlid(txUlid);
  }

  function confirmRemoveTransaction() {
    if (!selectedCustomerUlid || !confirmDeleteTxUlid) return;
    const txUlid = confirmDeleteTxUlid;
    deleteTransactionMutation.mutate({ customerUlid: selectedCustomerUlid, txUlid });
    if (selectedTransactionUlid === txUlid) setSelectedTransactionUlid(null);
    setConfirmDeleteTxUlid(null);
  }

  // Derived (not snapshotted) so the panel reflects the latest server data after any edit/delete.
  const selectedTransaction = selectedTransactionUlid
    ? rawTransactions.find((t) => t.ulid === selectedTransactionUlid) ?? null
    : null;

  // compute running balance per row: credit increases, debit decreases
  const runningBalances = transactions.reduce<number[]>((acc, tx) => {
    const prev = acc.length > 0 ? acc[acc.length - 1] : 0;
    acc.push(prev + Number(tx.credit ?? 0) - Number(tx.debit ?? 0));
    return acc;
  }, []);

  // Stable refs so useMemo columns don't need these as deps
  const runningBalancesRef = useRef<number[]>([]);
  runningBalancesRef.current = runningBalances;
  const txMenuUlidRef = useRef<string | null>(null);
  txMenuUlidRef.current = txMenuUlid;

  const inputCls = "w-full text-sm text-black border-0 focus:outline-none focus:ring-1 focus:ring-inset focus:ring-slate-400 bg-transparent px-2 py-1.5 rounded-none placeholder:text-text-muted";

  function exportableRows(): { date: string; particular: string; voucher_no: string; debit: string; credit: string; balance: string }[] {
    return transactions
      .filter((t) => t.ulid !== "__new__")
      .map((t, i) => ({
        date: t.date,
        particular: t.ulid === "__opening_balance__" ? "Opening Balance" : getParticularLabel(t.particular),
        voucher_no: t.voucher_no ?? "",
        debit: t.debit != null ? String(t.debit) : "",
        credit: t.credit != null ? String(t.credit) : "",
        balance: runningBalancesRef.current[i] != null ? String(runningBalancesRef.current[i]) : "",
      }));
  }

  function escapeHtml(value: string): string {
    return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function handlePrintLedger() {
    const rows = exportableRows();
    const win = window.open("", "_blank");
    if (!win) return;
    const title = `${selectedCustomer?.name ?? "Ledger"} — Transactions`;
    const rowsHtml = rows.map((r) => `
      <tr>
        <td>${escapeHtml(r.date)}</td>
        <td>${escapeHtml(r.particular)}</td>
        <td>${escapeHtml(r.voucher_no)}</td>
        <td class="num">${r.debit ? Number(r.debit).toLocaleString() : ""}</td>
        <td class="num">${r.credit ? Number(r.credit).toLocaleString() : ""}</td>
        <td class="num">${r.balance ? Number(r.balance).toLocaleString() : ""}</td>
      </tr>`).join("");
    win.document.write(`<!doctype html><html><head><title>${escapeHtml(title)}</title><style>
      body { font-family: sans-serif; padding: 24px; }
      h2 { margin: 0 0 4px; }
      p { margin: 0 0 16px; color: #555; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; }
      th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; }
      th { background: #f2f2f2; }
      td.num, th.num { text-align: right; }
    </style></head><body>
      <h2>${escapeHtml(selectedCustomer?.name ?? "Ledger")}</h2>
      <p>Transaction Ledger</p>
      <table>
        <thead><tr><th>Date</th><th>Particular</th><th>Voucher No</th><th class="num">Debit</th><th class="num">Credit</th><th class="num">Balance</th></tr></thead>
        <tbody>${rowsHtml}</tbody>
      </table>
    </body></html>`);
    win.document.close();
    win.focus();
    win.print();
  }

  function handleExportLedgerCsv() {
    const rows = exportableRows();
    const header = ["Date", "Particular", "Voucher No", "Debit", "Credit", "Balance"];
    const csvEscape = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
    const lines = [header, ...rows.map((r) => [r.date, r.particular, r.voucher_no, r.debit, r.credit, r.balance])]
      .map((cols) => cols.map(csvEscape).join(","))
      .join("\n");
    const blob = new Blob([lines], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(selectedCustomer?.name ?? "ledger").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-transactions.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Routes to whichever full-page editor matches how this transaction actually exists —
  // items page only if it already has items, otherwise the simple debit/credit editor.
  function openTransactionPage(tx: Transaction) {
    if (!selectedCustomerUlid) return;
    const hasItems = !!tx.items && tx.items.length > 0;
    const page = hasItems ? "goods-sold" : "amount-received";
    router.push(`/admin/customers/${page}?customer=${selectedCustomerUlid}&transaction=${tx.ulid}`);
  }

  // Explicit "Add Items" action — always opens the items page, even for a zero-item
  // Sales/Debit Note/Credit Note entry, so it can be turned into an itemized one.
  function openAddItemsPage(tx: Transaction) {
    if (!selectedCustomerUlid) return;
    router.push(`/admin/customers/goods-sold?customer=${selectedCustomerUlid}&transaction=${tx.ulid}`);
  }

  const columns: ColumnDef<Transaction, unknown>[] = useMemo(() => [
    {
      accessorKey: "date",
      header: "Date",
      size: 140,
      cell: ({ row }) => {
        if (row.original.ulid === "__opening_balance__") return <span className="text-sm font-medium text-black">{row.original.date}</span>;
        if (row.original.ulid === "__new__") return (
          <BsDateInput
            resetKey={selectedCustomerUlid ?? ""}
            value=""
            onChange={(val) => { draftRef.current.date = val; }}
            className={inputCls}
          />
        );
        return <span className="text-sm font-medium text-black">{row.original.date}</span>;
      },
    },
    {
      accessorKey: "particular",
      header: "Particular",
      meta: { borderLeft: true },
      size: 350,
      cell: ({ row }) => {
        if (row.original.ulid === "__new__") return (
          <ParticularCombobox
            key={`particular-${selectedCustomerUlid}`}
            customerUlid={selectedCustomerUlid ?? ""}
            onChange={(v) => { draftRef.current.particular = v; forceUpdate(); }}
          />
        );
        const items = row.original.items;
        return (
          <div className="py-0.5">
            <span className="block mb-1 text-sm font-medium text-black">{getParticularLabel(row.original.particular)}</span>
            {showFullDetails && items && items.length > 0 && (
              <div className="border-l-2 border-slate-200 pl-2">
                <div className="grid grid-cols-[1fr_44px_64px_56px_64px] gap-x-2 text-[10px] font-semibold uppercase tracking-wide text-text-muted/70">
                  <span>Item</span>
                  <span className="text-right">Qty</span>
                  <span className="text-right">Rate</span>
                  <span className="text-right">Disc</span>
                  <span className="text-right">Total</span>
                </div>
                {items.map((it) => (
                  <div key={it.ulid} className="grid grid-cols-[1fr_44px_64px_56px_64px] gap-x-2 text-[11px] leading-tight text-text-muted">
                    <span className="truncate text-text-default" title={it.product_name}>{it.product_name}</span>
                    <span className="text-right">{it.quantity}</span>
                    <span className="text-right">{it.rate.toLocaleString()}</span>
                    <span className="text-right">{it.discount.toLocaleString()}</span>
                    <span className="text-right font-semibold text-text-default">{it.total.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "voucher_no",
      header: "Voucher No",
      meta: { borderLeft: true },
      size: 140,
      cell: ({ row }) => {
        if (row.original.ulid === "__new__") return (
          <input
            key={`voucher-${selectedCustomerUlid}`}
            type="text"
            defaultValue=""
            onChange={(e) => { draftRef.current.voucher_no = e.target.value; }}
            placeholder="Voucher no..."
            className={inputCls}
          />
        );
        return row.original.voucher_no
          ? <span className="text-sm font-medium text-black">{row.original.voucher_no}</span>
          : null;
      },
    },
    {
      accessorKey: "debit",
      header: "Debit",
      meta: { borderLeft: true },
      size: 140,
      cell: ({ row }) => {
        if (row.original.ulid === "__new__") return (
          <input
            key={`debit-${selectedCustomerUlid}`}
            type="number"
            min="0"
            defaultValue=""
            onChange={(e) => { draftRef.current.debit = e.target.value; draftRef.current.credit = e.target.value ? "" : draftRef.current.credit; forceUpdate(); }}
            placeholder="0"
            className={`${inputCls}`}
          />
        );
        return row.original.debit != null
          ? <span className="text-sm font-medium text-black">{Number(row.original.debit).toLocaleString()}</span>
          : null;
      },
    },
    {
      accessorKey: "credit",
      header: "Credit",
      meta: { borderLeft: true },
      size: 140,
      cell: ({ row }) => {
        if (row.original.ulid === "__new__") return (
          <input
            key={`credit-${selectedCustomerUlid}`}
            type="number"
            min="0"
            defaultValue=""
            onChange={(e) => { draftRef.current.credit = e.target.value; draftRef.current.debit = e.target.value ? "" : draftRef.current.debit; forceUpdate(); }}
            placeholder="0"
            className={`${inputCls}`}
          />
        );
        return row.original.credit != null
          ? <span className="text-sm font-medium text-black">{Number(row.original.credit).toLocaleString()}</span>
          : null;
      },
    },
    {
      id: "balance",
      header: "Balance",
      size: 100,
      meta: { borderLeft: true },
      cell: ({ row }) => {
        const balance = runningBalancesRef.current[row.index];
        return <span className="text-sm font-medium text-black">{balance ? balance.toLocaleString() : null}</span>;
      },
    },
    {
      id: "actions",
      header: "",
      size: 40,
      meta: { borderLeft: true },
      cell: ({ row }) => {
        if (row.original.ulid === "__opening_balance__" || row.original.ulid === "__new__") return null;
        return (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (txMenuUlidRef.current === row.original.ulid) { setTxMenuUlid(null); setTxMenuPos(null); return; }
              const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
              setTxMenuPos({ top: rect.bottom + 4, left: rect.right - 144 });
              setTxMenuUlid(row.original.ulid);
            }}
            className="p-1 rounded hover:bg-slate-200 transition-colors text-text-muted hover:text-text-default cursor-pointer"
          >
            <MoreVertical className="h-3.5 w-3.5" />
          </button>
        );
      },
    },
  ], [selectedCustomerUlid, showFullDetails]);

  return (
    <div className="flex gap-0 transition-all duration-300 h-full">
      <div className="flex-1 min-w-0 flex flex-col p-6 gap-6 h-full">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-h3 font-bold text-text-default">Customers</h2>
            <p className="text-sm text-text-muted mt-0.5">Manage customer accounts, ledgers and outstanding balances.</p>
          </div>
        </div>

        {/* Two-column body */}
        <div className="flex gap-6 flex-1 min-h-0">
          {/* Side card */}
          <CustomerSidebar
            customers={customers}
            customersLoading={customersLoading}
            activeFiscalYearId={viewingFiscalYearId}
            selectedCustomerUlid={selectedCustomer?.ulid}
            search={sideSearch}
            onSearchChange={setSideSearch}
            onSelect={(customer) => trySwitchCustomer(customer.ulid)}
            onTrashClick={() => setTrashedCustomersOpen(true)}
            headerRight={
              <button
                onClick={openCreate}
                className="flex items-center gap-1.5 h-9 bg-black px-3 text-h4 font-semibold text-white hover:bg-black/80 transition-colors shrink-0 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                Add
              </button>
            }
            renderRowAction={(customer) => (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (openMenuUlid === customer.ulid) { setOpenMenuUlid(null); setMenuPos(null); return; }
                  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                  setMenuPos({ top: rect.bottom + 4, left: rect.right - 144 });
                  setOpenMenuUlid(customer.ulid);
                }}
                className="ml-1 shrink-0 p-1 rounded hover:bg-slate-300 transition-colors text-text-muted hover:text-text-default cursor-pointer"
              >
                <MoreVertical className="h-3.5 w-3.5" />
              </button>
            )}
          />

          {/* Table + detail card */}
          <div className="flex-1 min-w-0 flex flex-col gap-4 h-full min-h-0">
            {/* Account detail card */}
            <div className="bg-white px-5 py-4 space-y-3">
              {/* Top row: name + buttons */}
              <div className="flex items-start justify-between">
                <CustomerInfoBlock customer={selectedCustomer} />
                <div className="flex items-center shrink-0">
                  {customerHasDrift && selectedCustomer && viewingFiscalYearId && (
                    <button
                      type="button"
                      onClick={() => syncBalanceMutation.mutate({ ulid: selectedCustomer.ulid, fiscal_year_id: viewingFiscalYearId })}
                      disabled={syncBalanceMutation.isPending}
                      title="Recalculate this customer's balance for the viewed fiscal year and carry it forward through later years"
                      className="flex items-center gap-2 border border-slate-300 px-4 py-2 text-sm font-semibold text-text-default hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <RefreshCw className={`h-4 w-4 ${syncBalanceMutation.isPending ? "animate-spin" : ""}`} />
                      {syncBalanceMutation.isPending ? "Syncing..." : "Sync Balance"}
                    </button>
                  )}
                  <Link
                    href={selectedCustomer ? `/admin/customers/goods-sold?customer=${selectedCustomer.ulid}` : "/admin/customers/goods-sold"}
                    className="flex items-center gap-2 bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-black/80 transition-colors cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    Goods Sold
                  </Link>
                  <Link
                    href={selectedCustomer ? `/admin/customers/amount-received?customer=${selectedCustomer.ulid}` : "/admin/customers/amount-received"}
                    className="flex items-center gap-2 border border-slate-300 px-4 py-2 text-sm font-semibold text-text-default hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <CreditCard className="h-4 w-4" />
                    Amount Received
                  </Link>
                  <button
                    onClick={(e) => {
                      if (cardMenuOpen) { setCardMenuOpen(false); setCardMenuPos(null); return; }
                      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                      setCardMenuPos({ top: rect.bottom + 4, left: rect.right - 144 });
                      setCardMenuOpen(true);
                    }}
                    className="flex items-center border border-slate-300 px-1.5 py-2.5 text-text-muted hover:bg-slate-50 hover:text-text-default transition-colors cursor-pointer"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {selectedCustomer && (
                <div className="grid grid-cols-5 gap-4 pt-1 border-t border-slate-300">
                  <div>
                    <p className="text-sm-custom text-text-body">Remaining Balance</p>
                    <p className="text-sm-custom font-bold text-text-default mt-0.5">
                      {viewedRemainingBalance != null ? Number(viewedRemainingBalance).toLocaleString() : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm-custom text-text-body">Total Sales</p>
                    <p className="text-sm-custom font-bold text-text-default mt-0.5">{totalSales.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm-custom text-text-body">Total Received</p>
                    <p className="text-sm-custom font-bold text-text-default mt-0.5">{totalReceived.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm-custom text-text-body">Last Transaction</p>
                    <p className="text-sm-custom font-bold text-text-default mt-0.5">{lastTransactionDate ?? "—"}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setFiscalYearDraft(String(viewedFiscalYearId ?? "")); setFiscalYearModalOpen(true); }}
                    className="text-left cursor-pointer"
                  >
                    <p className="text-sm-custom text-text-body flex items-center gap-1">
                      Fiscal Year
                      {customerHasDrift && (
                        <span title="A later fiscal year's opening balance no longer matches this year's remaining balance. Use Sync Balance to fix it.">
                          <AlertTriangle className="h-3 w-3 text-amber-500" />
                        </span>
                      )}
                    </p>
                    <p className="text-sm-custom font-bold text-text-default mt-0.5 hover:underline">{viewedFiscalYear?.name ?? "—"}</p>
                  </button>
                </div>
              )}
            </div>

            {/* Table + invoice detail panel */}
            <div className="flex gap-4 flex-1 min-h-0">
              <div className="flex-1 min-w-0 flex flex-col min-h-0">
                {(dateFrom || dateTo) && (
                  <div className="flex items-center gap-2 mb-2 shrink-0">
                    <span className="inline-flex items-center gap-1.5 border border-slate-300 bg-slate-50 pl-2.5 pr-1.5 py-1 text-xs font-medium text-text-default">
                      Filtered: {dateFrom || "…"} → {dateTo || "…"}
                      <button
                        type="button"
                        onClick={() => { setDateFrom(""); setDateTo(""); }}
                        className="flex h-4 w-4 items-center justify-center text-text-muted hover:text-text-default cursor-pointer"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  </div>
                )}
                <DataTable
                  columns={columns}
                  data={transactions}
                  loading={transactionsLoading}
                  searchColumn="particular"
                  searchPlaceholder="Search transactions..."
                  meta={null}
                  hidePagination
                  fillHeight
                  scrollToBottomOnLoad
                  scrollToBottomKey={`${selectedCustomerUlid ?? ""}:${rawTransactions.length}`}
                  highlightRowId={highlightedTransactionUlid}
                  getRowId={(row) => row.ulid}
                  onPrint={selectedCustomer ? handlePrintLedger : undefined}
                  onExportCsv={selectedCustomer ? handleExportLedgerCsv : undefined}
                  moreActions={[
                    { label: showFullDetails ? "Hide Full" : "Show Full", icon: Maximize2, onClick: () => setShowFullDetails((v) => !v) },
                    { label: "Fiscal Year", icon: Calendar, onClick: () => { setFiscalYearDraft(String(viewedFiscalYearId ?? "")); setFiscalYearModalOpen(true); } },
                    { label: dateFrom || dateTo ? "Filter (active)" : "Filter", icon: FilterIcon, onClick: () => { setDateFromDraft(dateFrom); setDateToDraft(dateTo); setFilterModalOpen(true); } },
                    { label: "Recently Deleted", icon: Trash2, onClick: () => setTrashModalOpen(true) },
                  ]}
                  tableClassName="table-fixed"
                  onRowClick={(row) => {
                    if (row.ulid === "__new__") return;
                    if (row.ulid === "__opening_balance__") {
                      setSelectedTransactionUlid(null);
                      setOpeningBalanceDraft(viewedOpeningBalance ?? "");
                      setOpeningBalanceFiscalYearId(viewingFiscalYearId ? String(viewingFiscalYearId) : "");
                      setEditingOpeningBalance(true);
                      return;
                    }
                    setEditingOpeningBalance(false);
                    setSelectedTransactionUlid(row.ulid);
                  }}
                  onRowDoubleClick={(row) => { if (row.ulid !== "__new__" && row.ulid !== "__opening_balance__") openTransactionPage(row); }}
                  onRowBlur={(row) => { if (row.ulid === "__new__") tryAutoSaveTransaction(); }}
                />
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Opening balance edit panel */}
      <SlidePanel
        open={!!(editingOpeningBalance && selectedCustomer)}
        onClose={() => setEditingOpeningBalance(false)}
        title="Opening Balance"
        description="Set the starting balance for a fiscal year."
        submitLabel="Save"
        onSubmit={() => {
          if (!selectedCustomer) return;
          if (!openingBalanceFiscalYearId) { toast.warning("No fiscal year", "Select a fiscal year first."); return; }
          saveBalanceMutation.mutate({ ulid: selectedCustomer.ulid, opening_balance: openingBalanceDraft, fiscal_year_id: openingBalanceFiscalYearId });
          setEditingOpeningBalance(false);
        }}
      >
        {selectedCustomer && (
          <>
            <SelectField
              label="Fiscal Year"
              value={openingBalanceFiscalYearId}
              onChange={(e) => {
                const fyId = e.target.value;
                setOpeningBalanceFiscalYearId(fyId);
                const balance = selectedCustomer.balances?.find((b) => b.fiscal_year_id === Number(fyId));
                setOpeningBalanceDraft(balance ? String(balance.opening_balance) : "");
              }}
              options={[
                { label: "— Select fiscal year —", value: "" },
                ...fiscalYears.map((fy) => ({ label: fy.name, value: String(fy.id) })),
              ]}
            />
            <div>
              <label className="block text-sm font-semibold text-text-default">Amount</label>
              <input
                type="number" min="0"
                value={openingBalanceDraft}
                onChange={(e) => setOpeningBalanceDraft(e.target.value)}
                className="mt-1 w-full h-10 px-3 text-sm font-medium text-black border border-slate-400 focus:outline-none focus:border-slate-600 bg-white"
              />
            </div>
          </>
        )}
      </SlidePanel>

      {/* Transaction detail panel */}
      <BillEditPanel
        partyType="customer"
        partyUlid={selectedCustomerUlid ?? ""}
        transaction={selectedTransaction}
        queryKey={["acc-customer-transactions", selectedCustomer?.ulid, viewedFiscalYearId]}
        onClose={() => setSelectedTransactionUlid(null)}
        onDeleteTransaction={(tx) => removeTransaction(tx.ulid)}
        onAddItemsPage={(tx) => openAddItemsPage(tx)}
      />

      {/* Customer context menu portal */}
      {openMenuUlid && menuPos && createPortal(
        <div
          ref={menuRef}
          style={{ position: "fixed", top: menuPos.top, left: menuPos.left, zIndex: 9999 }}
          className="w-36 bg-white border border-slate-200 shadow-md"
        >
          {customers.filter(c => c.ulid === openMenuUlid).map(customer => (
            <div key={customer.ulid}>
              <button
                onClick={(e) => { e.stopPropagation(); trySwitchCustomer(customer.ulid); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-text-default hover:bg-slate-50 cursor-pointer"
              >
                <Eye className="h-3.5 w-3.5" /> View
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); openEdit(customer); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-text-default hover:bg-slate-50 cursor-pointer"
              >
                <Pencil className="h-3.5 w-3.5" /> Edit
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(customer.ulid); setOpenMenuUlid(null); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setActivityLogCustomer(customer); setActivityLogOpen(true); setOpenMenuUlid(null); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-text-default hover:bg-slate-50 cursor-pointer"
              >
                <History className="h-3.5 w-3.5" /> Activity Log
              </button>
            </div>
          ))}
        </div>,
        document.body
      )}

      {/* Card three-dot menu portal */}
      {cardMenuOpen && cardMenuPos && createPortal(
        <div
          ref={cardMenuRef}
          style={{ position: "fixed", top: cardMenuPos.top, left: cardMenuPos.left, zIndex: 9999 }}
          className="w-36 bg-white border border-slate-200 shadow-md"
        >
          <button
            onClick={() => { selectedCustomer && openEdit(selectedCustomer); setCardMenuOpen(false); }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-text-default hover:bg-slate-50 cursor-pointer"
          >
            <Pencil className="h-3.5 w-3.5" /> Edit
          </button>
          <button
            onClick={() => { selectedCustomer && deleteMutation.mutate(selectedCustomer.ulid); setCardMenuOpen(false); }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
          <button
            onClick={() => { setActivityLogCustomer(selectedCustomer); setActivityLogOpen(true); setCardMenuOpen(false); }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-text-default hover:bg-slate-50 cursor-pointer"
          >
            <History className="h-3.5 w-3.5" /> Activity Log
          </button>
        </div>,
        document.body
      )}

      <ActivityLogPanel
        open={activityLogOpen}
        onClose={() => setActivityLogOpen(false)}
        subjectType="acc_customer"
        subjectUlid={activityLogCustomer?.ulid ?? null}
        subjectTypeLabels={ACTIVITY_LOG_SUBJECT_TYPE_LABELS}
        title={activityLogCustomer ? `Activity Log — ${activityLogCustomer.name}` : "Activity Log"}
        onSelectEntry={(subjectType, subjectUlid) => {
          if (subjectType !== "acc_customer_transaction") return;
          if (activityLogCustomer) trySwitchCustomer(activityLogCustomer.ulid);
          setActivityLogOpen(false);
          setHighlightedTransactionUlid(subjectUlid);
          setTimeout(() => setHighlightedTransactionUlid(null), 500);
        }}
      />

      <FiscalYearModal
        open={fiscalYearModalOpen}
        onClose={() => setFiscalYearModalOpen(false)}
        fiscalYears={fiscalYears}
        draft={fiscalYearDraft}
        onDraftChange={setFiscalYearDraft}
        onApply={() => {
          if (!fiscalYearDraft) return;
          setViewingFiscalYearId(Number(fiscalYearDraft));
          setFiscalYearModalOpen(false);
        }}
        description="Choose which fiscal year's ledger to view for this customer."
      />

      <FilterModal
        open={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        dateFrom={dateFrom}
        dateTo={dateTo}
        dateFromDraft={dateFromDraft}
        dateToDraft={dateToDraft}
        resetKey={dateFilterResetKey}
        onDateFromDraftChange={setDateFromDraft}
        onDateToDraftChange={setDateToDraft}
        onApply={() => {
          setDateFrom(dateFromDraft);
          setDateTo(dateToDraft);
        }}
        onClearAll={() => {
          setDateFromDraft("");
          setDateToDraft("");
          setDateFrom("");
          setDateTo("");
          setDateFilterResetKey((k) => k + 1);
        }}
      />

      <TrashModal
        open={trashModalOpen}
        onClose={() => setTrashModalOpen(false)}
        loading={trashedLoading}
        transactions={trashedTransactions}
        restoring={restoreTransactionMutation.isPending}
        onRestore={(txUlid) => { if (selectedCustomerUlid) restoreTransactionMutation.mutate({ customerUlid: selectedCustomerUlid, txUlid }); }}
      />

      <TrashedCustomersModal
        open={trashedCustomersOpen}
        onClose={() => setTrashedCustomersOpen(false)}
        loading={trashedCustomersLoading}
        customers={trashedCustomers}
        restoring={restoreCustomerMutation.isPending}
        onRestore={(customerUlid) => restoreCustomerMutation.mutate(customerUlid)}
      />

      <ConfirmDialog
        open={pendingCustomerUlid !== null}
        title="Discard unsaved transaction?"
        description="You have an unsaved draft row in the ledger. Switching customers will discard it."
        confirmLabel="Discard & Switch"
        onCancel={() => setPendingCustomerUlid(null)}
        onConfirm={() => {
          if (pendingCustomerUlid) selectCustomerNow(pendingCustomerUlid);
          setPendingCustomerUlid(null);
        }}
      />

      <ConfirmDialog
        open={confirmDeleteTxUlid !== null}
        title="Delete transaction?"
        description="This transaction will be permanently removed. This cannot be undone."
        confirmLabel="Delete"
        onCancel={() => setConfirmDeleteTxUlid(null)}
        onConfirm={confirmRemoveTransaction}
      />

      {/* Transaction row three-dot menu portal */}
      {txMenuUlid && txMenuPos && createPortal(
        <div
          ref={txMenuRef}
          style={{ position: "fixed", top: txMenuPos.top, left: txMenuPos.left, zIndex: 9999 }}
          className="w-36 bg-white border border-slate-200 shadow-md"
        >
          <button
            onClick={() => {
              const tx = rawTransactions.find((t) => t.ulid === txMenuUlid);
              if (tx) openTransactionPage(tx);
              setTxMenuUlid(null); setTxMenuPos(null);
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-text-default hover:bg-slate-50 cursor-pointer"
          >
            <Pencil className="h-3.5 w-3.5" /> Edit
          </button>
          <button
            onClick={() => { if (txMenuUlid) removeTransaction(txMenuUlid); setTxMenuUlid(null); setTxMenuPos(null); }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
          <button
            onClick={() => {
              const tx = rawTransactions.find((t) => t.ulid === txMenuUlid);
              if (tx) setTxActivityLogTarget({ ulid: tx.ulid, label: getParticularLabel(tx.particular) });
              setTxMenuUlid(null); setTxMenuPos(null);
              setTxActivityLogOpen(true);
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-text-default hover:bg-slate-50 cursor-pointer"
          >
            <History className="h-3.5 w-3.5" /> Activity Log
          </button>
        </div>,
        document.body
      )}

      <ActivityLogPanel
        open={txActivityLogOpen}
        onClose={() => setTxActivityLogOpen(false)}
        subjectType="acc_customer_transaction"
        subjectUlid={txActivityLogTarget?.ulid ?? null}
        subjectTypeLabels={ACTIVITY_LOG_SUBJECT_TYPE_LABELS}
        title={txActivityLogTarget ? `Activity Log — ${txActivityLogTarget.label}` : "Activity Log"}
      />

      {/* Add Customer slide panel */}
      <CustomerFormPanel
        open={drawerOpen}
        onClose={closeDrawer}
        isEditing={!!editingCustomer}
        saving={saveMutation.isPending}
        form={form}
        errors={errors}
        fiscalYears={fiscalYears}
        onFieldChange={(field, value) => {
          setForm((f) => ({ ...f, [field]: value }));
          if (field === "name") setErrors((prev) => ({ ...prev, name: undefined }));
        }}
        onOpeningBalanceBlur={() => {
          if (editingCustomer?.ulid && form.opening_balance) {
            saveBalanceMutation.mutate({ ulid: editingCustomer.ulid, opening_balance: form.opening_balance, fiscal_year_id: form.fiscal_year_id });
          }
        }}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

export default function AdminCustomers() {
  return (
    <Suspense fallback={null}>
      <AdminCustomersContent />
    </Suspense>
  );
}
