"use client";

import { Suspense, useState, useEffect, useRef, useMemo, useReducer } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table/DataTable";
import { Plus, Search, MapPin, Phone, Receipt, CreditCard, X, MoreVertical, Pencil, Eye, Trash2, Maximize2, Calendar, Filter as FilterIcon } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { TRANSACTION_PARTICULARS, getParticularLabel, getParticularDirection, ITEM_CAPABLE_PARTICULARS } from "./constants";
import { toast } from "@/lib/toast";
import { SlidePanel } from "@/components/ui/form/SlidePanelForm";
import { InputField, NumberField, SelectField, ComboboxField } from "@/components/ui/form/FormField";
import { BsDateInput, isValidBsDate } from "@/components/ui/form/BsDateInput";
import { ProductCombobox, ProductOption } from "@/components/products/ProductCombobox";
import { ConfirmDialog } from "@/components/ui/dialog/ConfirmDialog";
import { MultiImageUpload } from "@/components/ui/form/MultiImageUpload";
import { useImageGroup } from "@/hooks/useImageGroup";
import { Modal } from "@/components/ui/Modal";

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
  items?: TransactionItem[];
};

type FiscalYear = {
  id: number;
  ulid: string;
  name: string;
};

type FormState = {
  name: string;
  address: string;
  phone: string;
  telephone: string;
  vat_no: string;
  fiscal_year_id: string;
  opening_balance: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

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

function ParticularCombobox({ vendorUlid, onChange }: { vendorUlid: string; onChange: (val: string) => void }) {
  const [value, setValue] = useState("");
  return (
    <div className="[&_input]:h-8 [&_input]:text-sm [&_input]:font-medium [&_input]:text-black [&_.mt-1]:mt-0">
      <ComboboxField
        key={vendorUlid}
        label=""
        options={PARTICULAR_OPTIONS}
        value={value}
        onChange={(v) => { setValue(v); onChange(v); }}
      />
    </div>
  );
}

function AdminAccountsContent() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sideSearch, setSideSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [selectedVendorUlid, setSelectedVendorUlid] = useState<string | null>(searchParams.get("vendor"));
  const [selectedTransactionUlid, setSelectedTransactionUlid] = useState<string | null>(null);
  const [openMenuUlid, setOpenMenuUlid] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [cardMenuOpen, setCardMenuOpen] = useState(false);
  const [cardMenuPos, setCardMenuPos] = useState<{ top: number; left: number } | null>(null);
  const cardMenuRef = useRef<HTMLDivElement>(null);
  const [txMenuUlid, setTxMenuUlid] = useState<string | null>(null);
  const [showFullDetails, setShowFullDetails] = useState(false);
  const [fiscalYearModalOpen, setFiscalYearModalOpen] = useState(false);
  const [trashModalOpen, setTrashModalOpen] = useState(false);
  // null = "follow the tenant's active fiscal year" (activeFiscalYearId); set once the user
  // explicitly picks one from the modal, to browse a different year's ledger.
  const [viewFiscalYearId, setViewFiscalYearId] = useState<number | null>(null);
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
  const [confirmDeleteItemUlid, setConfirmDeleteItemUlid] = useState<string | null>(null);
  const loadedReceiptForRef = useRef<string | null>(null);
  const receiptImage = useImageGroup("acc_vendor_transaction", "acc-vendor-transactions", "receipt");
  const [txMenuPos, setTxMenuPos] = useState<{ top: number; left: number } | null>(null);
  const txMenuRef = useRef<HTMLDivElement>(null);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const draftRef = useRef({ particular: "", voucher_no: "", debit: "", credit: "", date: "" });
  const [pendingVendorUlid, setPendingVendorUlid] = useState<string | null>(null);
  const [, forceUpdate] = useReducer((x: number) => x + 1, 0);
  const [txEdit, setTxEdit] = useState<{ date: string; particular: string; voucher_no: string; cheque_no: string; amount: string } | null>(null);
  const [itemEdits, setItemEdits] = useState<Record<string, { product_ulid: string; product_name: string; quantity: string; rate: string; discount: string }>>({});
  const EMPTY_NEW_ITEM = { product_ulid: "", product_name: "", quantity: "", rate: "", discount: "0" };
  const [newItem, setNewItem] = useState(EMPTY_NEW_ITEM);
  const [addingItem, setAddingItem] = useState(false);
  const [editingOpeningBalance, setEditingOpeningBalance] = useState(false);
  const [openingBalanceDraft, setOpeningBalanceDraft] = useState("");

  const { data: vendorsData, isLoading: vendorsLoading } = useQuery({
    queryKey: ["acc-vendors"],
    queryFn: () => apiFetch<{ data: Vendor[]; meta: Meta }>("/acc-vendors?per_page=100"),
  });

  const { data: settingsData } = useQuery({
    queryKey: ["settings"],
    queryFn: () => apiFetch<{ data: { fiscal_year_id: number | null; fiscal_year: { ulid: string; name: string } | null } }>("/settings"),
  });

  const { data: fiscalYearsData } = useQuery({
    queryKey: ["fiscal-years"],
    queryFn: () => apiFetch<{ data: FiscalYear[] }>("/fiscal-years"),
    staleTime: Infinity,
  });

  const activeFiscalYear = settingsData?.data?.fiscal_year ?? null;
  const activeFiscalYearId = settingsData?.data?.fiscal_year_id ?? null;
  const fiscalYears = fiscalYearsData?.data ?? [];

  const viewedFiscalYearId = viewFiscalYearId ?? activeFiscalYearId;
  const viewedFiscalYear = viewFiscalYearId
    ? fiscalYears.find((fy) => fy.id === viewFiscalYearId) ?? null
    : activeFiscalYear;

  const vendors = vendorsData?.data ?? [];

  const filteredVendors = vendors.filter((v) =>
    v.name.toLowerCase().includes(sideSearch.toLowerCase())
  );

  // Always derived from live query data so it updates automatically after mutations
  const selectedVendor = vendors.find((v) => v.ulid === selectedVendorUlid) ?? null;

  const activeBalance = activeFiscalYearId && selectedVendor
    ? selectedVendor.balances?.find((b) => b.fiscal_year_id === activeFiscalYearId) ?? null
    : null;

  const activeOpeningBalance = activeBalance?.opening_balance ?? null;

  // Stats shown against the vendor's ledger follow whichever fiscal year is being viewed,
  // not necessarily the tenant's active one — same shape as activeBalance above.
  const viewedBalance = viewedFiscalYearId && selectedVendor
    ? selectedVendor.balances?.find((b) => b.fiscal_year_id === viewedFiscalYearId) ?? null
    : null;
  const viewedRemainingBalance = viewedBalance?.remaining_balance ?? null;

  const { data: transactionsData, isLoading: transactionsLoading } = useQuery({
    queryKey: ["acc-vendor-transactions", selectedVendor?.ulid, viewedFiscalYearId],
    queryFn: () => apiFetch<{ data: Transaction[] }>(
      `/acc-vendors/${selectedVendor!.ulid}/transactions?per_page=1000${viewedFiscalYearId ? `&fiscal_year_id=${viewedFiscalYearId}` : ""}`
    ),
    enabled: !!selectedVendor,
  });

  useEffect(() => {
    if (!selectedVendorUlid && vendors.length > 0) setSelectedVendorUlid(vendors[0].ulid);
  }, [vendors]);

  useEffect(() => {
    draftRef.current = { particular: "", voucher_no: "", debit: "", credit: "", date: "" };
    setViewFiscalYearId(null); // back to the tenant's active fiscal year for the newly selected vendor
    setDateFrom("");
    setDateTo("");
  }, [selectedVendorUlid]);

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
    mutationFn: ({ vendorUlid, payload }: { vendorUlid: string; payload: object }) =>
      apiFetch(`/acc-vendors/${vendorUlid}/transactions`, { method: "POST", body: JSON.stringify(payload) }),
    onSuccess: (_data, variables) => {
      queryClient.refetchQueries({ queryKey: ["acc-vendor-transactions", variables.vendorUlid] });
      draftRef.current = { particular: "", voucher_no: "", debit: "", credit: "", date: "" };
      forceUpdate();
      toast.success("Transaction saved", "Entry has been recorded.");
    },
    onError: () => toast.error("Failed to save", "Could not save the transaction."),
  });

  const deleteTransactionMutation = useMutation({
    mutationFn: ({ vendorUlid, txUlid }: { vendorUlid: string; txUlid: string }) =>
      apiFetch(`/acc-vendors/${vendorUlid}/transactions/${txUlid}`, { method: "DELETE" }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["acc-vendor-transactions", variables.vendorUlid] });
      queryClient.invalidateQueries({ queryKey: ["acc-vendors"] });
      toast.success("Transaction deleted", "The transaction has been removed.");
    },
    onError: (err: any) => toast.error("Failed to delete transaction", err?.message ?? "Something went wrong."),
  });

  const { data: trashedData, isLoading: trashedLoading } = useQuery({
    queryKey: ["acc-vendor-transactions-trashed", selectedVendor?.ulid],
    queryFn: () => apiFetch<{ data: Transaction[] }>(`/acc-vendors/${selectedVendor!.ulid}/transactions/trashed`),
    enabled: !!selectedVendor && trashModalOpen,
  });
  const trashedTransactions = trashedData?.data ?? [];

  const restoreTransactionMutation = useMutation({
    mutationFn: ({ vendorUlid, txUlid }: { vendorUlid: string; txUlid: string }) =>
      apiFetch(`/acc-vendors/${vendorUlid}/transactions/${txUlid}/restore`, { method: "POST" }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["acc-vendor-transactions", variables.vendorUlid] });
      queryClient.invalidateQueries({ queryKey: ["acc-vendor-transactions-trashed", variables.vendorUlid] });
      queryClient.invalidateQueries({ queryKey: ["acc-vendors"] });
      toast.success("Transaction restored", "The transaction is back in the ledger.");
    },
    onError: (err: any) => toast.error("Failed to restore transaction", err?.message ?? "Something went wrong."),
  });

  const updateTransactionMutation = useMutation({
    mutationFn: ({ vendorUlid, txUlid, payload }: { vendorUlid: string; txUlid: string; payload: object }) =>
      apiFetch(`/acc-vendors/${vendorUlid}/transactions/${txUlid}`, { method: "PATCH", body: JSON.stringify(payload) }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["acc-vendor-transactions", variables.vendorUlid] });
      queryClient.invalidateQueries({ queryKey: ["acc-vendors"] });
    },
    onError: (err: any) => toast.error("Failed to update transaction", err?.message ?? "Something went wrong."),
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ vendorUlid, txUlid, itemUlid, payload }: { vendorUlid: string; txUlid: string; itemUlid: string; payload: object }) =>
      apiFetch(`/acc-vendors/${vendorUlid}/transactions/${txUlid}/items/${itemUlid}`, { method: "PATCH", body: JSON.stringify(payload) }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["acc-vendor-transactions", variables.vendorUlid] });
      queryClient.invalidateQueries({ queryKey: ["acc-vendors"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (err: any) => toast.error("Failed to update item", err?.message ?? "Something went wrong."),
  });

  const deleteItemMutation = useMutation({
    mutationFn: ({ vendorUlid, txUlid, itemUlid }: { vendorUlid: string; txUlid: string; itemUlid: string }) =>
      apiFetch(`/acc-vendors/${vendorUlid}/transactions/${txUlid}/items/${itemUlid}`, { method: "DELETE" }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["acc-vendor-transactions", variables.vendorUlid] });
      queryClient.invalidateQueries({ queryKey: ["acc-vendors"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Item removed", "The line item has been deleted.");
    },
    onError: (err: any) => toast.error("Failed to delete item", err?.message ?? "Something went wrong."),
  });

  const addItemMutation = useMutation({
    mutationFn: ({ vendorUlid, txUlid, payload }: { vendorUlid: string; txUlid: string; payload: object }) =>
      apiFetch<{ data: { ulid: string; product_ulid: string; quantity: number; rate: number; discount: number; total: number } }>(
        `/acc-vendors/${vendorUlid}/transactions/${txUlid}/items`, { method: "POST", body: JSON.stringify(payload) }
      ),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["acc-vendor-transactions", variables.vendorUlid] });
      queryClient.invalidateQueries({ queryKey: ["acc-vendors"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (err: any) => toast.error("Failed to add item", err?.message ?? "Something went wrong."),
  });

  function tryAutoSaveTransaction() {
    if (!selectedVendorUlid) return;
    const { particular, debit, credit } = draftRef.current;
    const date = draftRef.current.date;
    if (!isValidBsDate(date) || !particular.trim() || (!debit && !credit)) return;
    saveTransactionMutation.mutate({
      vendorUlid: selectedVendorUlid,
      payload: {
        date,
        particular: particular.trim(),
        voucher_no: draftRef.current.voucher_no || null,
        debit: debit ? parseFloat(debit) : null,
        credit: credit ? parseFloat(credit) : null,
      },
    });
  }

  const autoSaveMutation = useMutation({
    mutationFn: ({ ulid, payload }: { ulid?: string; payload: ReturnType<typeof buildPayload> }) =>
      ulid
        ? apiFetch(`/acc-vendors/${ulid}`, { method: "PUT", body: JSON.stringify(payload) })
        : apiFetch<{ data: Vendor }>("/acc-vendors", { method: "POST", body: JSON.stringify(payload) }),
    onSuccess: (data, variables) => {
      if (!variables.ulid) {
        setEditingVendor((data as { data: Vendor }).data);
        queryClient.invalidateQueries({ queryKey: ["acc-vendors"] });
      }
    },
  });

  const saveBalanceMutation = useMutation({
    mutationFn: ({ ulid, opening_balance, fiscal_year_id }: { ulid: string; opening_balance: string; fiscal_year_id?: string }) =>
      apiFetch(`/acc-vendors/${ulid}/balance`, {
        method: "POST",
        body: JSON.stringify({
          opening_balance: parseFloat(opening_balance),
          fiscal_year_id: fiscal_year_id ? parseInt(fiscal_year_id) : undefined,
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["acc-vendors"] });
    },
    onError: () => {
      toast.warning("Vendor saved", "But opening balance could not be saved — check if active fiscal year is set in Settings.");
    },
  });

  const saveMutation = useMutation({
    mutationFn: ({ ulid, payload }: { ulid?: string; payload: ReturnType<typeof buildPayload> }) =>
      ulid
        ? apiFetch(`/acc-vendors/${ulid}`, { method: "PUT", body: JSON.stringify(payload) })
        : apiFetch<{ data: Vendor }>("/acc-vendors", { method: "POST", body: JSON.stringify(payload) }),
    onSuccess: async (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["acc-vendors"] });
      const vendor = variables.ulid ? editingVendor : (data as { data: Vendor }).data;
      if (!variables.ulid) setEditingVendor((data as { data: Vendor }).data);

      if (vendor && form.opening_balance) {
        await saveBalanceMutation.mutateAsync({ ulid: vendor.ulid, opening_balance: form.opening_balance, fiscal_year_id: form.fiscal_year_id });
      }

      if (!variables.ulid) {
        toast.success("Vendor created", `"${form.name}" has been added.`);
      } else {
        toast.success("Vendor updated", `"${form.name}" has been updated.`);
        closeDrawer();
      }
    },
    onError: (err: any) => {
      if (err?.errors) {
        setErrors(err.errors);
        toast.warning("Please fix the errors", "Check the highlighted fields.");
      } else {
        toast.error(
          editingVendor ? "Failed to update vendor" : "Failed to create vendor",
          err?.message ?? "Something went wrong."
        );
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (ulid: string) => apiFetch(`/acc-vendors/${ulid}`, { method: "DELETE" }),
    onSuccess: (_, ulid) => {
      queryClient.invalidateQueries({ queryKey: ["acc-vendors"] });
      if (selectedVendor?.ulid === ulid) setSelectedVendorUlid(null);
      toast.success("Vendor deleted", "The vendor has been removed.");
    },
    onError: () => toast.error("Failed to delete", "Something went wrong."),
  });

  function openEdit(vendor: Vendor) {
    setEditingVendor(vendor);
    setForm({
      name: vendor.name,
      address: vendor.address ?? "",
      phone: vendor.phone ?? "",
      telephone: vendor.telephone ?? "",
      vat_no: vendor.vat_no ?? "",
      fiscal_year_id: activeFiscalYearId ? String(activeFiscalYearId) : "",
      opening_balance: vendor.balances?.find((b) => b.fiscal_year_id === activeFiscalYearId)?.opening_balance ?? "",
    });
    setErrors({});
    setDrawerOpen(true);
    setOpenMenuUlid(null);
  }

  function openCreate() {
    setEditingVendor(null);
    setForm({ ...INITIAL_FORM, fiscal_year_id: activeFiscalYearId ? String(activeFiscalYearId) : "" });
    setErrors({});
    setDrawerOpen(true);
  }

  function closeDrawer() {
    setDrawerOpen(false);
    setEditingVendor(null);
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

  function autoSave(currentForm: FormState = form) {
    if (!currentForm.name.trim()) return;
    autoSaveMutation.mutate({ ulid: editingVendor?.ulid, payload: buildPayload(currentForm) });
  }

  function validate(): boolean {
    const errs: FormErrors = {};
    if (!form.name.trim()) errs.name = "Name is required.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    saveMutation.mutate({ ulid: editingVendor?.ulid, payload: buildPayload(form) });
  }

  const rawTransactions = transactionsData?.data ?? [];

  // BS dates are zero-padded "YYYY-MM-DD" strings, so lexicographic comparison sorts correctly.
  const dateFilteredTransactions = (dateFrom || dateTo)
    ? rawTransactions.filter((t) => (!dateFrom || t.date >= dateFrom) && (!dateTo || t.date <= dateTo))
    : rawTransactions;

  const PURCHASE_PARTICULARS = ["purchase", "purchase_non_vat"];
  const PAYMENT_PARTICULARS = ["cash", "cheque"];

  const totalPurchase = dateFilteredTransactions
    .filter((t) => PURCHASE_PARTICULARS.includes(t.particular))
    .reduce((sum, t) => sum + Number(t.credit ?? 0), 0);

  const totalPaid = dateFilteredTransactions
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

  function selectVendorNow(ulid: string) {
    setSelectedVendorUlid(ulid);
    setSelectedTransactionUlid(null);
    setEditingOpeningBalance(false);
    setOpenMenuUlid(null);
  }

  // Switching vendors resets the quick-add draft row (see the effect keyed on
  // selectedVendorUlid) — confirm first if the user has actually typed something into it.
  function trySwitchVendor(ulid: string) {
    if (ulid === selectedVendorUlid) { setOpenMenuUlid(null); return; }
    if (draftHasContent()) {
      setPendingVendorUlid(ulid);
      return;
    }
    selectVendorNow(ulid);
  }

  function removeTransaction(txUlid: string) {
    if (!selectedVendorUlid) return;
    setConfirmDeleteTxUlid(txUlid);
  }

  function confirmRemoveTransaction() {
    if (!selectedVendorUlid || !confirmDeleteTxUlid) return;
    const txUlid = confirmDeleteTxUlid;
    deleteTransactionMutation.mutate({ vendorUlid: selectedVendorUlid, txUlid });
    if (selectedTransactionUlid === txUlid) setSelectedTransactionUlid(null);
    setConfirmDeleteTxUlid(null);
  }

  // Derived (not snapshotted) so the panel reflects the latest server data after any edit/delete.
  const selectedTransaction = selectedTransactionUlid
    ? rawTransactions.find((t) => t.ulid === selectedTransactionUlid) ?? null
    : null;

  useEffect(() => {
    setNewItem(EMPTY_NEW_ITEM);
    setAddingItem(false);
    if (!selectedTransaction) { setTxEdit(null); setItemEdits({}); return; }
    setTxEdit({
      date: selectedTransaction.date,
      particular: selectedTransaction.particular,
      voucher_no: selectedTransaction.voucher_no ?? "",
      cheque_no: selectedTransaction.cheque_no ?? "",
      amount: String(selectedTransaction.debit ?? selectedTransaction.credit ?? ""),
    });
    setItemEdits(Object.fromEntries((selectedTransaction.items ?? []).map((it) => [it.ulid, {
      product_ulid: it.product_ulid,
      product_name: it.product_name,
      quantity: String(it.quantity),
      rate: String(it.rate),
      discount: String(it.discount),
    }])));
    if (!selectedTransaction) { receiptImage.reset(); loadedReceiptForRef.current = null; }
    else if (loadedReceiptForRef.current !== selectedTransaction.ulid) {
      loadedReceiptForRef.current = selectedTransaction.ulid;
      receiptImage.load(selectedTransaction.ulid);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTransactionUlid]);

  const hasItems = !!(selectedTransaction?.items && selectedTransaction.items.length > 0);

  function saveTransactionHeader() {
    if (!selectedVendorUlid || !selectedTransactionUlid || !txEdit) return;
    if (!isValidBsDate(txEdit.date) || !txEdit.particular.trim()) return;
    const direction = getParticularDirection(txEdit.particular);
    updateTransactionMutation.mutate({
      vendorUlid: selectedVendorUlid,
      txUlid: selectedTransactionUlid,
      payload: {
        date: txEdit.date,
        particular: txEdit.particular,
        voucher_no: txEdit.voucher_no || null,
        cheque_no: txEdit.particular === "cheque" ? txEdit.cheque_no || null : null,
        debit: direction === "debit" ? Number(txEdit.amount) || null : null,
        credit: direction === "credit" ? Number(txEdit.amount) || null : null,
      },
    });
  }

  function suggestedRate(product: ProductOption | null): number | null {
    return product?.wacc ?? product?.cost_price ?? null;
  }

  // `overrides` lets a caller (e.g. the product combobox's onChange) save with values it
  // just computed, instead of relying on `itemEdits` state that a same-tick blur event
  // would still read as stale (React hasn't applied the update yet).
  function saveItem(itemUlid: string, overrides?: Partial<{ product_ulid: string; product_name: string; quantity: string; rate: string; discount: string }>) {
    const edit = itemEdits[itemUlid];
    if (!selectedVendorUlid || !selectedTransactionUlid || !edit) return;
    const merged = overrides ? { ...edit, ...overrides } : edit;
    if (!merged.product_ulid || !merged.quantity || Number(merged.quantity) <= 0 || merged.rate === "") return;
    updateItemMutation.mutate({
      vendorUlid: selectedVendorUlid,
      txUlid: selectedTransactionUlid,
      itemUlid,
      payload: {
        product_ulid: merged.product_ulid,
        quantity: Number(merged.quantity),
        rate: Number(merged.rate),
        discount: Number(merged.discount) || 0,
      },
    });
  }

  function saveNewItem() {
    if (!selectedVendorUlid || !selectedTransactionUlid) return;
    if (!newItem.product_ulid || !newItem.quantity || Number(newItem.quantity) <= 0 || newItem.rate === "") return;
    addItemMutation.mutate(
      {
        vendorUlid: selectedVendorUlid,
        txUlid: selectedTransactionUlid,
        payload: {
          product_ulid: newItem.product_ulid,
          quantity: Number(newItem.quantity),
          rate: Number(newItem.rate),
          discount: Number(newItem.discount) || 0,
        },
      },
      {
        onSuccess: (res) => {
          const it = res.data;
          setItemEdits((prev) => ({
            ...prev,
            [it.ulid]: {
              product_ulid: it.product_ulid,
              product_name: newItem.product_name,
              quantity: String(it.quantity),
              rate: String(it.rate),
              discount: String(it.discount),
            },
          }));
          setNewItem(EMPTY_NEW_ITEM);
          setAddingItem(false);
        },
      }
    );
  }

  function removeItem(itemUlid: string) {
    if (!selectedVendorUlid || !selectedTransactionUlid) return;
    setConfirmDeleteItemUlid(itemUlid);
  }

  function confirmRemoveItem() {
    if (!selectedVendorUlid || !selectedTransactionUlid || !confirmDeleteItemUlid) return;
    const itemUlid = confirmDeleteItemUlid;
    deleteItemMutation.mutate({ vendorUlid: selectedVendorUlid, txUlid: selectedTransactionUlid, itemUlid });
    if (selectedTransaction?.items?.length === 1) setSelectedTransactionUlid(null);
    setConfirmDeleteItemUlid(null);
  }

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

  const inputCls = "w-full text-sm font-medium text-black border border-slate-300 focus:outline-none focus:border-slate-600 bg-white px-2 py-1 rounded-none";

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
    const title = `${selectedVendor?.name ?? "Ledger"} — Transactions`;
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
      <h2>${escapeHtml(selectedVendor?.name ?? "Ledger")}</h2>
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
    a.download = `${(selectedVendor?.name ?? "ledger").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-transactions.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Routes to whichever full-page editor matches how this transaction actually exists —
  // items page only if it already has items, otherwise the simple debit/credit editor.
  function openTransactionPage(tx: Transaction) {
    if (!selectedVendorUlid) return;
    const hasItems = !!tx.items && tx.items.length > 0;
    const page = hasItems ? "goods-purchased" : "amount-paid";
    router.push(`/admin/accounts/${page}?vendor=${selectedVendorUlid}&transaction=${tx.ulid}`);
  }

  // Explicit "Add Items" action — always opens the items page, even for a zero-item
  // Purchase/Sales/Debit Note/Credit Note entry, so it can be turned into an itemized one.
  function openAddItemsPage(tx: Transaction) {
    if (!selectedVendorUlid) return;
    router.push(`/admin/accounts/goods-purchased?vendor=${selectedVendorUlid}&transaction=${tx.ulid}`);
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
            resetKey={selectedVendorUlid ?? ""}
            value=""
            onChange={(val) => { draftRef.current.date = val; }}
          />
        );
        return <span className="text-sm font-medium text-black">{row.original.date}</span>;
      },
    },
    {
      accessorKey: "particular",
      header: "Particular",
      size: 350,
      cell: ({ row }) => {
        if (row.original.ulid === "__new__") return (
          <ParticularCombobox
            key={`particular-${selectedVendorUlid}`}
            vendorUlid={selectedVendorUlid ?? ""}
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
      size: 140,
      cell: ({ row }) => {
        if (row.original.ulid === "__new__") return (
          <input
            key={`voucher-${selectedVendorUlid}`}
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
      size: 140,
      cell: ({ row }) => {
        if (row.original.ulid === "__new__") return (
          <input
            key={`debit-${selectedVendorUlid}`}
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
      size: 140,
      cell: ({ row }) => {
        if (row.original.ulid === "__new__") return (
          <input
            key={`credit-${selectedVendorUlid}`}
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
      cell: ({ row }) => {
        const balance = runningBalancesRef.current[row.index];
        const isSpecial = row.original.ulid === "__opening_balance__" || row.original.ulid === "__new__";
        return (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-black">{balance ? balance.toLocaleString() : null}</span>
            {!isSpecial && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (txMenuUlidRef.current === row.original.ulid) { setTxMenuUlid(null); setTxMenuPos(null); return; }
                  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                  setTxMenuPos({ top: rect.bottom + 4, left: rect.right - 144 });
                  setTxMenuUlid(row.original.ulid);
                }}
                className="p-1 rounded hover:bg-slate-100 transition-colors text-text-muted hover:text-text-default cursor-pointer"
              >
                <MoreVertical className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        );
      },
    },
  ], [selectedVendorUlid, showFullDetails]);

  return (
    <div className="flex gap-0 transition-all duration-300 h-full">
      <div className="flex-1 min-w-0 flex flex-col p-6 gap-6 h-full">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-h3 font-bold text-text-default">Accounts</h2>
            <p className="text-sm text-text-muted mt-0.5">Manage customer accounts, ledgers and outstanding balances.</p>
          </div>
        </div>

        {/* Two-column body */}
        <div className="flex gap-6 flex-1 min-h-0">
          {/* Side card */}
          <div className="w-80 shrink-0 flex flex-col h-full">
            {/* Search + button row */}
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
              <button
                onClick={openCreate}
                className="flex items-center gap-1.5 bg-black px-3 py-2 text-h4 font-semibold text-white hover:bg-black/80 transition-colors shrink-0 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                Add
              </button>
            </div>

            {/* Bordered section */}
            <div className="flex flex-col flex-1 min-h-0 border border-slate-400 overflow-hidden">
              {/* Table header */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-black shrink-0">
                <span className="text-xs font-semibold text-white uppercase tracking-wide">Name</span>
                <span className="text-xs font-semibold text-white uppercase tracking-wide">Balance</span>
              </div>

              {/* Vendor list */}
              <div className="flex-1 overflow-y-auto">
                {vendorsLoading ? (
                  <p className="p-4 text-sm text-text-muted text-center">Loading...</p>
                ) : filteredVendors.length === 0 ? (
                  <p className="p-4 text-sm text-text-muted text-center">No vendors found.</p>
                ) : (
                  filteredVendors.map((vendor) => (
                    <div
                      key={vendor.ulid}
                      onClick={() => trySwitchVendor(vendor.ulid)}
                      className={`flex items-center py-3.5 border-b border-slate-400 cursor-pointer transition-colors ${selectedVendor?.ulid === vendor.ulid ? "bg-slate-200 border-l-2 border-l-slate-700 pl-[14px] pr-1" : "pl-4 pr-1 hover:bg-slate-50"}`}
                    >
                      <span className={`text-sm truncate flex-1 min-w-0 ${selectedVendor?.ulid === vendor.ulid ? "font-semibold text-text-default" : "font-medium text-text-default"}`}>{vendor.name}</span>
                      <span className="text-sm font-semibold text-text-default text-right shrink-0">
                        {activeFiscalYearId && vendor.balances?.find((b) => b.fiscal_year_id === activeFiscalYearId)
                          ? Number(vendor.balances.find((b) => b.fiscal_year_id === activeFiscalYearId)!.remaining_balance).toLocaleString()
                          : "—"}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (openMenuUlid === vendor.ulid) { setOpenMenuUlid(null); setMenuPos(null); return; }
                          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                          setMenuPos({ top: rect.bottom + 4, left: rect.right - 144 });
                          setOpenMenuUlid(vendor.ulid);
                        }}
                        className="ml-1 shrink-0 p-1 rounded hover:bg-slate-300 transition-colors text-text-muted hover:text-text-default cursor-pointer"
                      >
                        <MoreVertical className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Table + detail card */}
          <div className="flex-1 min-w-0 flex flex-col gap-4 h-full min-h-0">
            {/* Account detail card */}
            <div className="bg-white px-5 py-4 space-y-3">
              {/* Top row: name + buttons */}
              <div className="flex items-start justify-between">
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
                            <span>
                              {[selectedVendor.phone, selectedVendor.telephone].filter(Boolean).join(" / ")}
                            </span>
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
                <div className="flex items-center shrink-0">
                  <Link
                    href={selectedVendor ? `/admin/accounts/goods-purchased?vendor=${selectedVendor.ulid}` : "/admin/accounts/goods-purchased"}
                    className="flex items-center gap-2 bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-black/80 transition-colors cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    Goods Purchased
                  </Link>
                  <Link
                    href={selectedVendor ? `/admin/accounts/amount-paid?vendor=${selectedVendor.ulid}` : "/admin/accounts/amount-paid"}
                    className="flex items-center gap-2 border border-slate-300 px-4 py-2 text-sm font-semibold text-text-default hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <CreditCard className="h-4 w-4" />
                    Amount Paid
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

              {selectedVendor && (
                <div className="grid grid-cols-5 gap-4 pt-1 border-t border-slate-300">
                  <div>
                    <p className="text-sm-custom text-text-body">Remaining Balance</p>
                    <p className="text-sm-custom font-bold text-text-default mt-0.5">
                      {viewedRemainingBalance != null ? Number(viewedRemainingBalance).toLocaleString() : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm-custom text-text-body">Total Purchase</p>
                    <p className="text-sm-custom font-bold text-text-default mt-0.5">{totalPurchase.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm-custom text-text-body">Total Paid</p>
                    <p className="text-sm-custom font-bold text-text-default mt-0.5">{totalPaid.toLocaleString()}</p>
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
                    <p className="text-sm-custom text-text-body">Fiscal Year</p>
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
                  scrollToBottomKey={`${selectedVendorUlid ?? ""}:${rawTransactions.length}`}
                  onPrint={selectedVendor ? handlePrintLedger : undefined}
                  onExportCsv={selectedVendor ? handleExportLedgerCsv : undefined}
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
                      setOpeningBalanceDraft(activeOpeningBalance ?? "");
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

              {/* Transaction detail panel */}
              {selectedTransaction && txEdit && <div className="w-[280px] shrink-0 bg-white border border-slate-200 flex flex-col overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                  <p className="text-sm-custom font-bold text-text-default">{getParticularLabel(selectedTransaction.particular)}</p>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {ITEM_CAPABLE_PARTICULARS.includes(selectedTransaction.particular) && (
                      <button
                        onClick={() => openAddItemsPage(selectedTransaction)}
                        className="h-7 px-2 text-xs font-semibold text-text-default border border-slate-300 hover:bg-slate-50 cursor-pointer transition-colors"
                      >
                        Add Items
                      </button>
                    )}
                    <button
                      onClick={() => removeTransaction(selectedTransaction.ulid)}
                      title="Delete transaction"
                      className="h-7 w-7 flex items-center justify-center text-text-muted hover:text-red-600 hover:bg-red-50 cursor-pointer transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => setSelectedTransactionUlid(null)} className="h-7 w-7 flex items-center justify-center text-text-muted hover:text-text-default cursor-pointer transition-colors">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Header fields */}
                <div className="px-4 py-3 border-b border-slate-100 space-y-2">
                  <p className="text-xs font-semibold text-text-default flex items-center justify-between gap-1.5">
                    <span className="flex items-center gap-1.5"><Receipt className="h-3.5 w-3.5" /> Details</span>
                    {(updateTransactionMutation.isPending || updateItemMutation.isPending || addItemMutation.isPending || deleteItemMutation.isPending) && (
                      <span className="text-[10px] font-normal text-text-muted">Saving...</span>
                    )}
                  </p>
                  <div className="space-y-2 [&_input]:h-8 [&_input]:text-sm [&_input]:font-medium [&_input]:text-black [&_select]:h-8 [&_select]:text-sm [&_select]:font-medium [&_select]:text-black [&_.mt-1]:mt-0">
                    <div>
                      <label className="block text-xs text-text-muted mb-1">Date</label>
                      <BsDateInput value={txEdit.date} onChange={(v) => setTxEdit((s) => s && { ...s, date: v })} onBlur={saveTransactionHeader} />
                    </div>
                    <div>
                      <label className="block text-xs text-text-muted mb-1">Voucher No</label>
                      <input
                        type="text"
                        value={txEdit.voucher_no}
                        onChange={(e) => setTxEdit((s) => s && { ...s, voucher_no: e.target.value })}
                        onBlur={saveTransactionHeader}
                        className="w-full h-8 px-2 text-sm font-medium text-black border border-slate-300 focus:outline-none focus:border-slate-500 bg-white"
                      />
                    </div>
                    {!hasItems && (
                      <>
                        <div>
                          <SelectField
                            label="Particular"
                            value={txEdit.particular}
                            onChange={(e) => {
                              const value = e.target.value;
                              setTxEdit((s) => s && { ...s, particular: value, cheque_no: value === "cheque" ? s.cheque_no : "" });
                              saveTransactionHeader();
                            }}
                            options={TRANSACTION_PARTICULARS.map((p) => ({ label: p.label, value: p.value }))}
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-text-muted mb-1">
                            Amount <span className="normal-case">({getParticularDirection(txEdit.particular) === "debit" ? "Debit" : "Credit"})</span>
                          </label>
                          <input
                            type="number" min="0"
                            value={txEdit.amount}
                            onChange={(e) => setTxEdit((s) => s && { ...s, amount: e.target.value })}
                            onBlur={saveTransactionHeader}
                            className="w-full h-8 px-2 text-sm font-medium text-black border border-slate-300 focus:outline-none focus:border-slate-500 bg-white"
                          />
                        </div>
                        {txEdit.particular === "cheque" && (
                          <div>
                            <label className="block text-xs text-text-muted mb-1">Cheque No</label>
                            <input
                              type="text"
                              value={txEdit.cheque_no}
                              onChange={(e) => setTxEdit((s) => s && { ...s, cheque_no: e.target.value })}
                              onBlur={saveTransactionHeader}
                              className="w-full h-8 px-2 text-sm font-medium text-black border border-slate-300 focus:outline-none focus:border-slate-500 bg-white"
                            />
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Receipt photo */}
                <div className="px-4 py-3 border-b border-slate-100">
                  <MultiImageUpload
                    label="Receipt Photo"
                    value={receiptImage.images}
                    onChange={receiptImage.setImages}
                    savedImages={receiptImage.savedImages}
                    groupName={receiptImage.groupName}
                    onGroupNameChange={receiptImage.setGroupName}
                    onGroupNameBlur={receiptImage.updateGroupName}
                    onSave={() => receiptImage.save(selectedTransaction.ulid)}
                    onRemoveSaved={receiptImage.removeSaved}
                    saving={receiptImage.saving}
                    uploadStates={receiptImage.uploadStates}
                    max={1}
                  />
                </div>

                {/* Items */}
                {hasItems && (
                  <div className="px-4 py-3 border-b border-slate-100 space-y-2">
                    <p className="text-xs font-semibold text-text-default flex items-center gap-1.5">
                      <Receipt className="h-3.5 w-3.5" /> Items ({selectedTransaction.items!.length})
                    </p>
                    <div className="space-y-3">
                      {selectedTransaction.items!.map((item) => {
                        const edit = itemEdits[item.ulid];
                        if (!edit) return null;
                        return (
                          <div key={item.ulid} className="border border-slate-200 p-2 space-y-1.5">
                            <div className="[&_input]:h-8 [&_input]:text-sm [&_input]:font-medium [&_input]:text-black [&_.mt-1]:mt-0">
                              <ProductCombobox
                                value={edit.product_ulid}
                                onChange={(val, product) => {
                                  const rate = suggestedRate(product);
                                  const rateStr = rate != null ? String(rate) : edit.rate;
                                  setItemEdits((prev) => ({
                                    ...prev,
                                    [item.ulid]: {
                                      ...prev[item.ulid],
                                      product_ulid: val,
                                      product_name: product?.name ?? prev[item.ulid].product_name,
                                      rate: rateStr,
                                    },
                                  }));
                                  saveItem(item.ulid, { product_ulid: val, rate: rateStr });
                                }}
                              />
                            </div>
                            <div className="grid grid-cols-3 gap-1.5">
                              <div>
                                <label className="block text-[10px] text-text-muted mb-0.5">Qty</label>
                                <input
                                  type="number" min="0"
                                  value={edit.quantity}
                                  onChange={(e) => setItemEdits((prev) => ({ ...prev, [item.ulid]: { ...prev[item.ulid], quantity: e.target.value } }))}
                                  onBlur={() => saveItem(item.ulid)}
                                  className="w-full h-8 px-2 text-sm font-medium text-black border border-slate-300 focus:outline-none focus:border-slate-500 bg-white"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] text-text-muted mb-0.5">Rate</label>
                                <input
                                  type="number" min="0"
                                  value={edit.rate}
                                  onChange={(e) => setItemEdits((prev) => ({ ...prev, [item.ulid]: { ...prev[item.ulid], rate: e.target.value } }))}
                                  onBlur={() => saveItem(item.ulid)}
                                  className="w-full h-8 px-2 text-sm font-medium text-black border border-slate-300 focus:outline-none focus:border-slate-500 bg-white"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] text-text-muted mb-0.5">Discount</label>
                                <input
                                  type="number" min="0"
                                  value={edit.discount}
                                  onChange={(e) => setItemEdits((prev) => ({ ...prev, [item.ulid]: { ...prev[item.ulid], discount: e.target.value } }))}
                                  onBlur={() => saveItem(item.ulid)}
                                  className="w-full h-8 px-2 text-sm font-medium text-black border border-slate-300 focus:outline-none focus:border-slate-500 bg-white"
                                />
                              </div>
                            </div>
                            <div className="flex items-center justify-between pt-0.5">
                              <span className="text-sm-custom text-text-body">Total <span className="font-semibold text-text-default">{item.total.toLocaleString()}</span></span>
                              <button onClick={() => removeItem(item.ulid)} className="text-text-muted hover:text-red-600 transition-colors cursor-pointer">
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {addingItem ? (
                      <div className="border border-dashed border-slate-300 p-2 space-y-1.5">
                        <div className="[&_input]:h-8 [&_input]:text-sm [&_input]:font-medium [&_input]:text-black [&_.mt-1]:mt-0">
                          <ProductCombobox
                            value={newItem.product_ulid}
                            onChange={(val, product) => {
                              const rate = suggestedRate(product);
                              setNewItem((s) => ({ ...s, product_ulid: val, product_name: product?.name ?? s.product_name, rate: rate != null ? String(rate) : s.rate }));
                            }}
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-1.5">
                          <div>
                            <label className="block text-[10px] text-text-muted mb-0.5">Qty</label>
                            <input
                              type="number" min="0"
                              value={newItem.quantity}
                              onChange={(e) => setNewItem((s) => ({ ...s, quantity: e.target.value }))}
                              className="w-full h-8 px-2 text-sm font-medium text-black border border-slate-300 focus:outline-none focus:border-slate-500 bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-text-muted mb-0.5">Rate</label>
                            <input
                              type="number" min="0"
                              value={newItem.rate}
                              onChange={(e) => setNewItem((s) => ({ ...s, rate: e.target.value }))}
                              className="w-full h-8 px-2 text-sm font-medium text-black border border-slate-300 focus:outline-none focus:border-slate-500 bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-text-muted mb-0.5">Discount</label>
                            <input
                              type="number" min="0"
                              value={newItem.discount}
                              onChange={(e) => setNewItem((s) => ({ ...s, discount: e.target.value }))}
                              className="w-full h-8 px-2 text-sm font-medium text-black border border-slate-300 focus:outline-none focus:border-slate-500 bg-white"
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-end gap-2 pt-0.5">
                          <button onClick={() => { setNewItem(EMPTY_NEW_ITEM); setAddingItem(false); }} className="text-xs text-text-muted hover:text-text-default cursor-pointer">Cancel</button>
                          <button onClick={saveNewItem} className="text-xs font-semibold text-white bg-black px-2 py-1 cursor-pointer hover:bg-black/80">Add</button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setAddingItem(true)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-text-default hover:text-black transition-colors cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5" /> Add Item
                      </button>
                    )}

                    <div className="pt-2 space-y-1 border-t border-slate-100">
                      <div className="flex items-center justify-between">
                        <span className="text-sm-custom text-text-body">Discount</span>
                        <span className="text-sm-custom text-text-default">{selectedTransaction.discount_percent ?? 0}%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm-custom text-text-body">Taxable Amount</span>
                        <span className="text-sm-custom text-text-default">{(selectedTransaction.taxable_amount ?? 0).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm-custom text-text-body">VAT (13%)</span>
                        <span className="text-sm-custom text-text-default">{(selectedTransaction.vat_amount ?? 0).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm-custom font-bold text-text-default">Grand Total</span>
                        <span className="text-sm-custom font-bold text-text-default">{(selectedTransaction.grand_total ?? 0).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center mt-auto border-t border-slate-100">
                  <button
                    onClick={() => setSelectedTransactionUlid(null)}
                    className="flex-1 h-10 text-sm font-semibold text-text-default hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => { saveTransactionHeader(); setSelectedTransactionUlid(null); }}
                    className="flex-1 h-10 bg-black text-sm font-semibold text-white hover:bg-black/80 cursor-pointer transition-colors"
                  >
                    {updateTransactionMutation.isPending ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>}

              {/* Opening balance edit panel */}
              {editingOpeningBalance && selectedVendor && <div className="w-[280px] shrink-0 bg-white border border-slate-200 flex flex-col overflow-y-auto">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                  <p className="text-sm-custom font-bold text-text-default">Opening Balance</p>
                  <button onClick={() => setEditingOpeningBalance(false)} className="text-text-muted hover:text-text-default transition-colors cursor-pointer">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="px-4 py-3 space-y-2">
                  <div>
                    <label className="block text-xs text-text-muted mb-1">Fiscal Year</label>
                    <p className="text-sm font-medium text-text-default">{activeFiscalYear?.name ?? "No fiscal year"}</p>
                  </div>
                  <div>
                    <label className="block text-xs text-text-muted mb-1">Amount</label>
                    <input
                      type="number" min="0"
                      value={openingBalanceDraft}
                      onChange={(e) => setOpeningBalanceDraft(e.target.value)}
                      className="w-full h-8 px-2 text-sm font-medium text-black border border-slate-300 focus:outline-none focus:border-slate-500 bg-white"
                    />
                  </div>
                </div>
                <div className="flex items-center mt-auto border-t border-slate-100">
                  <button
                    onClick={() => setEditingOpeningBalance(false)}
                    className="flex-1 h-10 text-sm font-semibold text-text-default hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (!activeFiscalYearId) { toast.warning("No fiscal year", "Set an active fiscal year in Settings first."); return; }
                      saveBalanceMutation.mutate({ ulid: selectedVendor.ulid, opening_balance: openingBalanceDraft, fiscal_year_id: String(activeFiscalYearId) });
                      setEditingOpeningBalance(false);
                    }}
                    className="flex-1 h-10 bg-black text-sm font-semibold text-white hover:bg-black/80 cursor-pointer transition-colors"
                  >
                    Save
                  </button>
                </div>
              </div>}
            </div>
          </div>
        </div>
      </div>

      {/* Vendor context menu portal */}
      {openMenuUlid && menuPos && createPortal(
        <div
          ref={menuRef}
          style={{ position: "fixed", top: menuPos.top, left: menuPos.left, zIndex: 9999 }}
          className="w-36 bg-white border border-slate-200 shadow-md"
        >
          {filteredVendors.filter(v => v.ulid === openMenuUlid).map(vendor => (
            <div key={vendor.ulid}>
              <button
                onClick={(e) => { e.stopPropagation(); trySwitchVendor(vendor.ulid); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-text-default hover:bg-slate-50 cursor-pointer"
              >
                <Eye className="h-3.5 w-3.5" /> View
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); openEdit(vendor); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-text-default hover:bg-slate-50 cursor-pointer"
              >
                <Pencil className="h-3.5 w-3.5" /> Edit
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(vendor.ulid); setOpenMenuUlid(null); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
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
            onClick={() => { selectedVendor && openEdit(selectedVendor); setCardMenuOpen(false); }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-text-default hover:bg-slate-50 cursor-pointer"
          >
            <Pencil className="h-3.5 w-3.5" /> Edit
          </button>
          <button
            onClick={() => { selectedVendor && deleteMutation.mutate(selectedVendor.ulid); setCardMenuOpen(false); }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        </div>,
        document.body
      )}

      <Modal
        open={fiscalYearModalOpen}
        onClose={() => setFiscalYearModalOpen(false)}
        title="Fiscal Year"
        description="Choose which fiscal year's ledger to view for this vendor."
        initialWidth={460}
        initialHeight={320}
        onSubmit={() => {
          setViewFiscalYearId(fiscalYearDraft ? Number(fiscalYearDraft) : null);
          setFiscalYearModalOpen(false);
        }}
        submitLabel="Apply"
      >
        {fiscalYears.length === 0 ? (
          <p className="text-sm text-text-muted">No fiscal years configured yet.</p>
        ) : (
          <SelectField
            label="Fiscal Year"
            value={fiscalYearDraft}
            onChange={(e) => setFiscalYearDraft(e.target.value)}
            options={fiscalYears.map((fy) => ({
              label: fy.name,
              value: String(fy.id),
            }))}
          />
        )}
      </Modal>

      <Modal
        open={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        title="Filter"
        description="Show only transactions within a date range."
        initialWidth={420}
        initialHeight={320}
        onSubmit={() => {
          setDateFrom(dateFromDraft);
          setDateTo(dateToDraft);
        }}
        submitLabel="Apply"
      >
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-text-default uppercase tracking-wide mb-1.5">From Date</label>
            <BsDateInput key={`from-${dateFilterResetKey}`} value={dateFromDraft} onChange={setDateFromDraft} placeholder="YYYY-MM-DD" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-default uppercase tracking-wide mb-1.5">To Date</label>
            <BsDateInput key={`to-${dateFilterResetKey}`} value={dateToDraft} onChange={setDateToDraft} placeholder="YYYY-MM-DD" />
          </div>
        </div>
        {(dateFrom || dateTo || dateFromDraft || dateToDraft) && (
          <button
            type="button"
            onClick={() => {
              setDateFromDraft("");
              setDateToDraft("");
              setDateFrom("");
              setDateTo("");
              setDateFilterResetKey((k) => k + 1);
            }}
            className="text-sm font-medium text-text-muted hover:text-text-default cursor-pointer"
          >
            Clear All Filters
          </button>
        )}
      </Modal>

      <Modal
        open={trashModalOpen}
        onClose={() => setTrashModalOpen(false)}
        title="Recently Deleted"
        description="Deleted transactions for this vendor. Restoring recalculates the vendor's balance, but does not re-apply any stock/cost changes the transaction originally made."
        initialWidth={520}
        initialHeight={420}
      >
        {trashedLoading && <p className="text-sm text-text-muted">Loading…</p>}
        {!trashedLoading && trashedTransactions.length === 0 && (
          <p className="text-sm text-text-muted">Nothing deleted for this vendor.</p>
        )}
        {!trashedLoading && trashedTransactions.length > 0 && (
          <div className="space-y-2">
            {trashedTransactions.map((tx) => (
              <div key={tx.ulid} className="flex items-center justify-between border border-slate-200 px-3 py-2">
                <div>
                  <p className="text-sm font-semibold text-text-default">{getParticularLabel(tx.particular)}</p>
                  <p className="text-xs text-text-muted">
                    {tx.date} {tx.voucher_no ? `· Voucher ${tx.voucher_no}` : ""} {tx.debit != null ? `· Debit ${Number(tx.debit).toLocaleString()}` : ""} {tx.credit != null ? `· Credit ${Number(tx.credit).toLocaleString()}` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={restoreTransactionMutation.isPending}
                  onClick={() => { if (selectedVendorUlid) restoreTransactionMutation.mutate({ vendorUlid: selectedVendorUlid, txUlid: tx.ulid }); }}
                  className="shrink-0 px-3 py-1.5 text-xs font-semibold text-text-default border border-slate-300 hover:bg-slate-50 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  Restore
                </button>
              </div>
            ))}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={pendingVendorUlid !== null}
        title="Discard unsaved transaction?"
        description="You have an unsaved draft row in the ledger. Switching vendors will discard it."
        confirmLabel="Discard & Switch"
        onCancel={() => setPendingVendorUlid(null)}
        onConfirm={() => {
          if (pendingVendorUlid) selectVendorNow(pendingVendorUlid);
          setPendingVendorUlid(null);
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

      <ConfirmDialog
        open={confirmDeleteItemUlid !== null}
        title="Delete line item?"
        description="If this is the last item, the whole transaction will be removed too. This cannot be undone."
        confirmLabel="Delete"
        onCancel={() => setConfirmDeleteItemUlid(null)}
        onConfirm={confirmRemoveItem}
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
        </div>,
        document.body
      )}

      {/* Add Vendor slide panel */}
      <SlidePanel
        open={drawerOpen}
        onClose={closeDrawer}
        title={editingVendor ? "Edit Vendor" : "Add Vendor"}
        description={editingVendor ? "Update the vendor details." : "Fill in the details to create a new vendor."}
        submitLabel={saveMutation.isPending ? "Saving..." : editingVendor ? "Update Vendor" : "Save Vendor"}
        onSubmit={handleSubmit}
      >
        <InputField
          label="Name"
          required
          placeholder="e.g. Nepal Traders Pvt. Ltd."
          value={form.name}
          onChange={(e) => {
            setForm((f) => ({ ...f, name: e.target.value }));
            setErrors((prev) => ({ ...prev, name: undefined }));
          }}
          onBlur={() => autoSave()}
          error={errors.name}
        />
        <InputField
          label="Address"
          placeholder="e.g. Kathmandu, Nepal"
          value={form.address}
          onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
          onBlur={() => autoSave()}
        />
        <InputField
          label="Phone"
          placeholder="e.g. 9801234567"
          value={form.phone}
          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          onBlur={() => autoSave()}
        />
        <InputField
          label="Telephone"
          placeholder="e.g. 01-4123456"
          value={form.telephone}
          onChange={(e) => setForm((f) => ({ ...f, telephone: e.target.value }))}
          onBlur={() => autoSave()}
        />
        <InputField
          label="VAT No"
          placeholder="e.g. 123456789"
          value={form.vat_no}
          onChange={(e) => setForm((f) => ({ ...f, vat_no: e.target.value }))}
          onBlur={() => autoSave()}
        />
        <SelectField
          label="Fiscal Year"
          value={form.fiscal_year_id}
          onChange={(e) => setForm((f) => ({ ...f, fiscal_year_id: e.target.value }))}
          options={[
            { label: "— Select fiscal year —", value: "" },
            ...fiscalYears.map((fy) => ({ label: fy.name, value: String(fy.id) })),
          ]}
        />

        <NumberField
          label="Opening Balance"
          placeholder="0.00"
          allowDecimal
          value={form.opening_balance}
          onChange={(e) => setForm((f) => ({ ...f, opening_balance: e.target.value }))}
          onBlur={() => {
            if (editingVendor?.ulid && form.opening_balance) {
              saveBalanceMutation.mutate({ ulid: editingVendor.ulid, opening_balance: form.opening_balance, fiscal_year_id: form.fiscal_year_id });
            }
          }}
        />
      </SlidePanel>
    </div>
  );
}

export default function AdminAccounts() {
  return (
    <Suspense fallback={null}>
      <AdminAccountsContent />
    </Suspense>
  );
}
