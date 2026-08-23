"use client";

import "@zener/nepali-datepicker-react/index.css";
import { useState, useEffect, useRef, useMemo, useReducer } from "react";
import NepaliDatePicker, { NepaliDate } from "@zener/nepali-datepicker-react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table/DataTable";
import { Plus, Search, MapPin, Phone, Receipt, CreditCard, X, ExternalLink, Download, Send, MoreVertical, Pencil, Eye, Trash2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { TRANSACTION_PARTICULARS } from "@/constants/accounting";
import { toast } from "@/lib/toast";
import { SlidePanel } from "@/components/ui/form/SlidePanelForm";
import { InputField, NumberField, SelectField, ComboboxField } from "@/components/ui/form/FormField";

type VendorOpeningBalance = {
  fiscal_year_id: number;
  opening_balance: string;
};

type Vendor = {
  ulid: string;
  name: string;
  address: string | null;
  phone: string | null;
  telephone: string | null;
  vat_no: string | null;
  opening_balances: VendorOpeningBalance[];
};

type Meta = {
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
  from: number;
  to: number;
};

type Transaction = {
  ulid: string;
  date: string;
  particular: string;
  voucher_no: string | null;
  type: string | null;
  debit: number | null;
  credit: number | null;
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


function isValidBsDate(str: string): boolean {
  if (!str || str.length !== 10) return false;
  const parts = str.split("-");
  if (parts.length !== 3) return false;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 32) return false;
  try {
    new NepaliDate(str);
    return true;
  } catch {
    return false;
  }
}

function DraftDateInput({ vendorUlid, onDateChange, onBlur }: { vendorUlid: string; onDateChange: (val: string) => void; onBlur: () => void }) {
  const [text, setText] = useState("");
  const [calendarOpen, setCalendarOpen] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 8);
    let formatted = raw;
    if (raw.length > 4) formatted = `${raw.slice(0, 4)}-${raw.slice(4)}`;
    if (raw.length > 6) formatted = `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6)}`;
    setText(formatted);
    onDateChange(formatted);
  }

  return (
    <div className="relative w-full">
      <input
        key={vendorUlid}
        type="text"
        value={text}
        onChange={handleChange}
        onFocus={() => setCalendarOpen(true)}
        onBlur={() => { setTimeout(() => { setCalendarOpen(false); onBlur(); }, 200); }}
        placeholder="YYYY-MM-DD"
        className="w-full h-8 px-2 text-sm font-medium text-black border border-slate-300 focus:outline-none focus:border-slate-500 bg-white"
      />
      {calendarOpen && (
        <div className="absolute top-full left-0 z-50">
          <NepaliDatePicker
            open={true}
            showclear={false}
            className="draft-date-picker"
            value={isValidBsDate(text) ? text : undefined}
            onChange={(d) => {
              if (d instanceof NepaliDate) {
                const val = `${d.getFullYear()}-${String((d.getMonth() as number) + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
                setText(val);
                onDateChange(val);
              }
              setCalendarOpen(false);
            }}
            lang="en"
          />
        </div>
      )}
    </div>
  );
}

const PARTICULAR_OPTIONS = TRANSACTION_PARTICULARS.map((p) => ({ value: p, label: p }));

function ParticularCombobox({ vendorUlid, onChange, onBlur }: { vendorUlid: string; onChange: (val: string) => void; onBlur: () => void }) {
  const [value, setValue] = useState("");
  return (
    <div onBlur={onBlur} className="[&_input]:h-8 [&_input]:text-sm [&_input]:font-medium [&_input]:text-black [&_.mt-1]:mt-0">
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

export default function AdminAccounts() {
  const queryClient = useQueryClient();
  const [sideSearch, setSideSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [selectedVendorUlid, setSelectedVendorUlid] = useState<string | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [openMenuUlid, setOpenMenuUlid] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [cardMenuOpen, setCardMenuOpen] = useState(false);
  const [cardMenuPos, setCardMenuPos] = useState<{ top: number; left: number } | null>(null);
  const cardMenuRef = useRef<HTMLDivElement>(null);
  const [txMenuUlid, setTxMenuUlid] = useState<string | null>(null);
  const [txMenuPos, setTxMenuPos] = useState<{ top: number; left: number } | null>(null);
  const txMenuRef = useRef<HTMLDivElement>(null);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const draftRef = useRef({ particular: "", voucher_no: "", debit: "", credit: "", date: "" });
  const [, forceUpdate] = useReducer((x: number) => x + 1, 0);

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

  const vendors = vendorsData?.data ?? [];

  const filteredVendors = vendors.filter((v) =>
    v.name.toLowerCase().includes(sideSearch.toLowerCase())
  );

  // Always derived from live query data so it updates automatically after mutations
  const selectedVendor = vendors.find((v) => v.ulid === selectedVendorUlid) ?? null;

  const activeOpeningBalance = activeFiscalYearId && selectedVendor
    ? selectedVendor.opening_balances?.find((ob) => ob.fiscal_year_id === activeFiscalYearId)?.opening_balance ?? null
    : null;

  const { data: transactionsData, isLoading: transactionsLoading } = useQuery({
    queryKey: ["acc-vendor-transactions", selectedVendor?.ulid],
    queryFn: () => apiFetch<{ data: Transaction[] }>(`/acc-vendors/${selectedVendor!.ulid}/transactions`),
    enabled: !!selectedVendor,
  });

  useEffect(() => {
    if (!selectedVendorUlid && vendors.length > 0) setSelectedVendorUlid(vendors[0].ulid);
  }, [vendors]);

  useEffect(() => {
    draftRef.current = { particular: "", voucher_no: "", debit: "", credit: "", date: "" };
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

  const saveOpeningBalanceMutation = useMutation({
    mutationFn: ({ ulid, opening_balance, fiscal_year_id }: { ulid: string; opening_balance: string; fiscal_year_id?: string }) =>
      apiFetch(`/acc-vendors/${ulid}/opening-balance`, {
        method: "POST",
        body: JSON.stringify({
          opening_balance: parseFloat(opening_balance),
          fiscal_year_id: fiscal_year_id ? parseInt(fiscal_year_id) : undefined,
        }),
      }),
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
        await saveOpeningBalanceMutation.mutateAsync({ ulid: vendor.ulid, opening_balance: form.opening_balance, fiscal_year_id: form.fiscal_year_id });
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
      opening_balance: vendor.opening_balances?.find((ob) => ob.fiscal_year_id === activeFiscalYearId)?.opening_balance ?? "",
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

  function fiscalYearStartDate(name: string): string {
    // name like "2080/081" or "080/081" — start year is the first part
    const match = name.match(/(\d+)/);
    if (!match) return name;
    const year = match[1].length === 4 ? match[1].slice(1) : match[1]; // keep last 3 digits
    return `${year}-4-1`;
  }

  const openingBalanceRow: Transaction | null = activeOpeningBalance != null
    ? {
        ulid: "__opening_balance__",
        date: activeFiscalYear ? fiscalYearStartDate(activeFiscalYear.name) : "Opening",
        particular: "Opening Balance",
        voucher_no: null,
        type: "Opening",
        debit: null,
        credit: Number(activeOpeningBalance),
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
    ...(openingBalanceRow ? [openingBalanceRow, ...rawTransactions] : rawTransactions),
    draftTransaction,
  ];

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

  const columns: ColumnDef<Transaction, unknown>[] = useMemo(() => [
    {
      accessorKey: "date",
      header: "Date",
      size: 140,
      cell: ({ row }) => {
        if (row.original.ulid === "__opening_balance__") return <span className="text-sm font-medium text-black">{row.original.date}</span>;
        if (row.original.ulid === "__new__") return (
          <DraftDateInput
            vendorUlid={selectedVendorUlid ?? ""}
            onDateChange={(val) => { draftRef.current.date = val; }}
            onBlur={tryAutoSaveTransaction}
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
            onBlur={tryAutoSaveTransaction}
          />
        );
        return <span className="text-sm font-medium text-black">{row.original.particular}</span>;
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
            onBlur={tryAutoSaveTransaction}
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
            onBlur={tryAutoSaveTransaction}
            placeholder="0"
            className={`${inputCls} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
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
            onBlur={tryAutoSaveTransaction}
            placeholder="0"
            className={`${inputCls} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
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
  ], [selectedVendorUlid]);

  return (
    <div className="flex gap-0 transition-all duration-300 h-full">
      <div className="flex-1 min-w-0 flex flex-col p-6 gap-6 h-full">
        <nav className="flex items-center gap-1.5 text-sm text-text-muted">
          <Link href="/admin" className="hover:text-text-default transition-colors">Dashboard</Link>
          <span>/</span>
          <span className="text-text-default font-medium">Accounts</span>
        </nav>

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
                      onClick={() => { setSelectedVendorUlid(vendor.ulid); setSelectedTransaction(null); setOpenMenuUlid(null); }}
                      className={`flex items-center py-3.5 border-b border-slate-400 cursor-pointer transition-colors ${selectedVendor?.ulid === vendor.ulid ? "bg-slate-200 border-l-2 border-l-slate-700 pl-[14px] pr-1" : "pl-4 pr-1 hover:bg-slate-50"}`}
                    >
                      <span className={`text-sm truncate flex-1 min-w-0 ${selectedVendor?.ulid === vendor.ulid ? "font-semibold text-text-default" : "font-medium text-text-default"}`}>{vendor.name}</span>
                      <span className="text-sm font-semibold text-text-default text-right shrink-0">
                        {activeFiscalYearId && vendor.opening_balances?.find((ob) => ob.fiscal_year_id === activeFiscalYearId)
                          ? Number(vendor.opening_balances.find((ob) => ob.fiscal_year_id === activeFiscalYearId)!.opening_balance).toLocaleString()
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
          <div className="flex-1 min-w-0 flex flex-col gap-4 self-start">
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
                  <button className="flex items-center gap-2 bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-black/80 transition-colors cursor-pointer">
                    <Plus className="h-4 w-4" />
                    Goods Purchased
                  </button>
                  <button className="flex items-center gap-2 border border-slate-300 px-4 py-2 text-sm font-semibold text-text-default hover:bg-slate-50 transition-colors cursor-pointer">
                    <CreditCard className="h-4 w-4" />
                    Amount Paid
                  </button>
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
                <div className="grid grid-cols-6 gap-4 pt-1 border-t border-slate-100">
                  <div>
                    <p className="text-sm-custom text-text-body">Opening Balance</p>
                    <p className="text-sm-custom font-bold text-text-default mt-0.5">
                      {activeOpeningBalance != null ? Number(activeOpeningBalance).toLocaleString() : "—"}
                    </p>
                    <p className="text-sm-custom text-text-body mt-0.5">{activeFiscalYear?.name ?? "No fiscal year"}</p>
                  </div>
                  <div>
                    <p className="text-sm-custom text-text-body">Total Purchase</p>
                    <p className="text-sm-custom font-bold text-text-default mt-0.5">—</p>
                    <p className="text-sm-custom text-text-body mt-0.5">Invoices</p>
                  </div>
                  <div>
                    <p className="text-sm-custom text-text-body">Total Paid</p>
                    <p className="text-sm-custom font-bold text-green-600 mt-0.5">—</p>
                    <p className="text-sm-custom text-text-body mt-0.5">Payments</p>
                  </div>
                  <div>
                    <p className="text-sm-custom text-text-body">Total Credit</p>
                    <p className="text-sm-custom font-bold text-green-600 mt-0.5">—</p>
                    <p className="text-sm-custom text-text-body mt-0.5">Credit Notes</p>
                  </div>
                  <div>
                    <p className="text-sm-custom text-text-body">Transactions</p>
                    <p className="text-sm-custom font-bold text-text-default mt-0.5">—</p>
                    <p className="text-sm-custom text-text-body mt-0.5">This Period</p>
                  </div>
                  <div>
                    <p className="text-sm-custom text-text-body">Last Transaction</p>
                    <p className="text-sm-custom font-bold text-text-default mt-0.5">—</p>
                  </div>
                </div>
              )}
            </div>

            {/* Table + invoice detail panel */}
            <div className="flex gap-4">
              <div className="flex-1 min-w-0">
                <DataTable
                  columns={columns}
                  data={transactions}
                  loading={transactionsLoading}
                  searchColumn="particular"
                  searchPlaceholder="Search transactions..."
                  meta={null}
                  tableClassName="table-fixed"
                  onRowDoubleClick={(row) => { if (row.ulid !== "__new__") setSelectedTransaction(row); }}
                />
              </div>

              {/* Transaction detail panel */}
              {selectedTransaction && <div className="w-[350px] shrink-0 bg-white border border-slate-200 flex flex-col overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                  <p className="text-sm-custom font-bold text-text-default">{selectedTransaction.voucher_no ?? selectedTransaction.particular}</p>
                  <button onClick={() => setSelectedTransaction(null)} className="text-text-muted hover:text-text-default transition-colors cursor-pointer">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Badges */}
                <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-100">
                  <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-600">INV-1042</span>
                  <span className="text-xs font-semibold px-2 py-0.5 bg-orange-50 text-orange-600">Unpaid</span>
                </div>

                {/* Invoice Details */}
                <div className="px-4 py-3 border-b border-slate-100 space-y-2">
                  <p className="text-xs font-semibold text-text-default flex items-center gap-1.5">
                    <Receipt className="h-3.5 w-3.5" /> Invoice Details
                  </p>
                  <div className="space-y-1.5">
                    {[
                      { label: "Date", value: "Jan 10, 2026" },
                      { label: "Due Date", value: "Jan 25, 2026" },
                      { label: "Customer", value: "Alice Johnson" },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex items-center justify-between">
                        <span className="text-sm-custom text-text-body">{label}</span>
                        <span className="text-sm-custom text-text-default">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Amount Details */}
                <div className="px-4 py-3 border-b border-slate-100 space-y-2">
                  <p className="text-xs font-semibold text-text-default flex items-center gap-1.5">
                    <CreditCard className="h-3.5 w-3.5" /> Amount Details
                  </p>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm-custom text-text-body">Subtotal</span>
                      <span className="text-sm-custom text-text-default">Rs. 13,392</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm-custom text-text-body">VAT (13%)</span>
                      <span className="text-sm-custom text-text-default">Rs. 1,608</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm-custom text-text-body">Total Amount</span>
                      <span className="text-sm-custom font-bold text-red-600">Rs. 15,000</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm-custom text-text-body">Paid Amount</span>
                      <span className="text-sm-custom text-text-default">Rs. 0</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm-custom text-text-body">Due Amount</span>
                      <span className="text-sm-custom font-bold text-red-600">Rs. 15,000</span>
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div className="px-4 py-3 border-b border-slate-100 space-y-2">
                  <p className="text-xs font-semibold text-text-default flex items-center gap-1.5">
                    <Receipt className="h-3.5 w-3.5" /> Items (2)
                  </p>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm-custom text-text-body">Exide Battery 60Ah</span>
                      <span className="text-sm-custom text-text-default">2 × Rs. 6,000</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm-custom text-text-body">Engine Oil 5W-30</span>
                      <span className="text-sm-custom text-text-default">2 × Rs. 1,500</span>
                    </div>
                  </div>
                  <button className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer">View all items</button>
                </div>

                {/* Actions */}
                <div className="px-4 py-3 space-y-2">
                  <p className="text-xs font-semibold text-text-default">Actions</p>
                  <button className="flex w-full items-center justify-center gap-2 border border-slate-200 px-3 py-2 text-sm-custom font-semibold text-text-default hover:bg-slate-50 transition-colors cursor-pointer">
                    <ExternalLink className="h-3.5 w-3.5" /> View Invoice
                  </button>
                  <button className="flex w-full items-center justify-center gap-2 bg-green-600 px-3 py-2 text-sm-custom font-semibold text-white hover:bg-green-700 transition-colors cursor-pointer">
                    <CreditCard className="h-3.5 w-3.5" /> Receive Payment
                  </button>
                  <button className="flex w-full items-center justify-center gap-2 border border-slate-200 px-3 py-2 text-sm-custom font-semibold text-text-default hover:bg-slate-50 transition-colors cursor-pointer">
                    <Download className="h-3.5 w-3.5" /> Download PDF
                  </button>
                  <button className="flex w-full items-center justify-center gap-2 border border-slate-200 px-3 py-2 text-sm-custom font-semibold text-text-default hover:bg-slate-50 transition-colors cursor-pointer">
                    <Send className="h-3.5 w-3.5" /> Send Invoice
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
                onClick={(e) => { e.stopPropagation(); setSelectedVendorUlid(vendor.ulid); setOpenMenuUlid(null); }}
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

      {/* Transaction row three-dot menu portal */}
      {txMenuUlid && txMenuPos && createPortal(
        <div
          ref={txMenuRef}
          style={{ position: "fixed", top: txMenuPos.top, left: txMenuPos.left, zIndex: 9999 }}
          className="w-36 bg-white border border-slate-200 shadow-md"
        >
          <button
            onClick={() => { setTxMenuUlid(null); setTxMenuPos(null); }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-text-default hover:bg-slate-50 cursor-pointer"
          >
            <Eye className="h-3.5 w-3.5" /> View
          </button>
          <button
            onClick={() => { setTxMenuUlid(null); setTxMenuPos(null); }}
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
              saveOpeningBalanceMutation.mutate({ ulid: editingVendor.ulid, opening_balance: form.opening_balance, fiscal_year_id: form.fiscal_year_id });
            }
          }}
        />
      </SlidePanel>
    </div>
  );
}
