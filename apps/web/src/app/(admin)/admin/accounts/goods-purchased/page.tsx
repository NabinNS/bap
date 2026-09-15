"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2, Plus, ArrowLeft, ListOrdered, Check } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { toast } from "@/lib/toast";
import { BsDateInput, getTodayBs, isValidBsDate } from "@/components/ui/form/BsDateInput";
import { numberToWords } from "@/lib/numberToWords";
import { ProductCombobox, ProductOption } from "@/components/products/ProductCombobox";
import { CreateProductPanel } from "@/components/products/CreateProductPanel";
import { MultiImageUpload } from "@/components/ui/form/MultiImageUpload";
import { useImageGroup } from "@/hooks/useImageGroup";
import { VendorSidebar } from "../_components/VendorSidebar";
import { VendorInfoBlock } from "../_components/VendorInfoBlock";
import { Vendor } from "../_components/types";

type Meta = {
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
  from: number;
  to: number;
};

type FiscalYear = {
  id: number;
  ulid: string;
  name: string;
};

type LineItem = {
  key: number;
  productUlid: string;
  particular: string;
  quantity: string;
  rate: string;
  discount: string;
  saved: boolean;
  itemUlid: string | null;
};

type BillTotals = {
  discountAmount: number;
  taxableAmount: number;
  vatAmount: number;
  grandTotal: number;
};

type SavedItem = {
  ulid: string;
  product_ulid: string;
  product_name: string;
  quantity: number;
  rate: number;
  amount: number;
  discount: number;
  total: number;
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
  discount_percent: number | null;
  discount_amount: number | null;
  taxable_amount: number | null;
  vat_amount: number | null;
  grand_total: number | null;
  items: SavedItem[];
};

let nextKey = 1;

function emptyRow(): LineItem {
  return { key: nextKey++, productUlid: "", particular: "", quantity: "", rate: "", discount: "0", saved: false, itemUlid: null };
}


function GoodsPurchasedContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const vendorParam = searchParams.get("vendor");
  const editTransactionParam = searchParams.get("transaction");
  const queryClient = useQueryClient();

  const [sideSearch, setSideSearch] = useState("");
  const [selectedVendorUlid, setSelectedVendorUlid] = useState<string | null>(vendorParam);
  const [rows, setRows] = useState<LineItem[]>([emptyRow()]);
  const [billDate, setBillDate] = useState(getTodayBs);
  const [billNo, setBillNo] = useState("");
  const [transactionUlid, setTransactionUlid] = useState<string | null>(null);
  // Which fiscal year this bill is recorded against — defaults to the tenant's active one
  // once it loads, but the user can pick a different year via the dropdown before saving.
  const [selectedFiscalYearId, setSelectedFiscalYearId] = useState<number | null>(null);
  // Mirrors transactionUlid but updates synchronously — ensureTransactionUlid needs the
  // fresh id right after awaiting the row save that creates the transaction.
  const transactionUlidRef = useRef<string | null>(null);
  const [discountPercent, setDiscountPercent] = useState("0");
  const [discountAmountDraft, setDiscountAmountDraft] = useState<string | null>(null);
  const [billTotals, setBillTotals] = useState<BillTotals | null>(null);
  const [createProductRowKey, setCreateProductRowKey] = useState<number | null>(null);
  const [createProductQuery, setCreateProductQuery] = useState("");
  const savingKeysRef = useRef<Set<number>>(new Set());
  const loadedTransactionRef = useRef<string | null>(null);
  const loadedReceiptForRef = useRef<string | null>(null);

  const receiptImage = useImageGroup("acc_vendor_transaction", "acc-vendor-transactions", "bill");

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
  const selectedVendor = vendors.find((v) => v.ulid === selectedVendorUlid) ?? null;

  const { data: transactionsData } = useQuery({
    queryKey: ["acc-vendor-transactions", selectedVendor?.ulid],
    queryFn: () => apiFetch<{ data: SavedTransaction[] }>(`/acc-vendors/${selectedVendor!.ulid}/transactions`),
    enabled: !!selectedVendor && !!editTransactionParam,
  });

  useEffect(() => {
    if (!selectedVendorUlid && vendors.length > 0) setSelectedVendorUlid(vendors[0].ulid);
  }, [vendors]);

  // Starting a fresh bill whenever the vendor changes — previous vendor's draft/transaction doesn't carry over.
  useEffect(() => {
    if (editTransactionParam) return;
    setRows([emptyRow()]);
    transactionUlidRef.current = null;
    setTransactionUlid(null);
    setBillDate(getTodayBs());
    setBillNo("");
    setDiscountPercent("0");
    setDiscountAmountDraft(null);
    setBillTotals(null);
    setSelectedFiscalYearId(activeFiscalYearId);
  }, [selectedVendorUlid]);

  // Settings load asynchronously — default to the active fiscal year once it arrives,
  // as long as the user hasn't already picked something (or started editing a bill).
  useEffect(() => {
    if (selectedFiscalYearId === null && activeFiscalYearId !== null && !transactionUlid) {
      setSelectedFiscalYearId(activeFiscalYearId);
    }
  }, [activeFiscalYearId, selectedFiscalYearId, transactionUlid]);

  // Load the existing transaction into the form once, when editing via ?transaction=.
  useEffect(() => {
    if (!editTransactionParam || loadedTransactionRef.current === editTransactionParam) return;
    const tx = transactionsData?.data.find((t) => t.ulid === editTransactionParam);
    if (!tx) return;
    loadedTransactionRef.current = editTransactionParam;
    transactionUlidRef.current = tx.ulid;
    setTransactionUlid(tx.ulid);
    setSelectedFiscalYearId(tx.fiscal_year_id);
    setBillDate(tx.date);
    setBillNo(tx.voucher_no ?? "");
    setDiscountPercent(String(tx.discount_percent ?? 0));
    setBillTotals({
      discountAmount: tx.discount_amount ?? 0,
      taxableAmount: tx.taxable_amount ?? 0,
      vatAmount: tx.vat_amount ?? 0,
      grandTotal: tx.grand_total ?? 0,
    });
    const savedRows: LineItem[] = tx.items.map((it) => ({
      key: nextKey++,
      productUlid: it.product_ulid,
      particular: it.product_name,
      quantity: String(it.quantity),
      rate: String(it.rate),
      discount: String(it.discount),
      saved: true,
      itemUlid: it.ulid,
    }));
    setRows([...savedRows, emptyRow()]);
  }, [editTransactionParam, transactionsData]);

  // Load whatever receipt photo is already attached once the transaction actually exists
  // (it's created lazily on the first item add — see addRow/save flow below).
  useEffect(() => {
    if (!transactionUlid) { receiptImage.reset(); loadedReceiptForRef.current = null; return; }
    if (loadedReceiptForRef.current === transactionUlid) return;
    loadedReceiptForRef.current = transactionUlid;
    receiptImage.load(transactionUlid);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- receiptImage is a stable-shaped hook result, not a dep
  }, [transactionUlid]);

  function selectVendor(ulid: string) {
    setSelectedVendorUlid(ulid);
    router.replace(`/admin/accounts/goods-purchased?vendor=${ulid}`);
  }

  function updateRow(key: number, field: keyof Omit<LineItem, "key" | "saved" | "itemUlid">, value: string) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, [field]: value } : r)));
  }

  function suggestedRate(product: ProductOption | null): number | null {
    return product?.wacc ?? product?.cost_price ?? null;
  }

  function selectProduct(key: number, ulid: string, product: ProductOption | null) {
    const rate = suggestedRate(product);
    setRows((prev) => prev.map((r) => (r.key === key
      ? { ...r, productUlid: ulid, particular: product?.name ?? "", rate: rate != null ? String(rate) : r.rate }
      : r)));
  }

  function addRow() {
    setRows((prev) => [...prev, emptyRow()]);
  }

  function removeRow(key: number) {
    const row = rows.find((r) => r.key === key);
    if (!row) return;
    if (row.saved && row.itemUlid) {
      if (!selectedVendorUlid || !transactionUlid) return;
      if (!confirm("Delete this line item?")) return;
      deleteItemMutation.mutate(
        { vendorUlid: selectedVendorUlid, txUlid: transactionUlid, itemUlid: row.itemUlid },
        { onSuccess: () => setRows((prev) => prev.filter((r) => r.key !== key)) }
      );
      return;
    }
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.key !== key) : prev));
  }

  function rowAmount(row: LineItem): number {
    const qty = parseFloat(row.quantity) || 0;
    const rate = parseFloat(row.rate) || 0;
    return qty * rate;
  }

  function rowDiscount(row: LineItem): number {
    return parseFloat(row.discount) || 0;
  }

  function rowTotal(row: LineItem): number {
    return Math.max(0, rowAmount(row) - rowDiscount(row));
  }

  const subtotal = rows.reduce((sum, r) => sum + rowTotal(r), 0);
  const totalQuantity = rows.reduce((sum, r) => sum + (parseFloat(r.quantity) || 0), 0);
  const grandTotalValue = billTotals?.grandTotal ?? subtotal;

  // Displayed amount: the draft while typing, otherwise the server-computed value (falls back
  // to a client-side estimate from discountPercent before the first save round-trips).
  const calculatedDiscount = (subtotal * (Number(discountPercent) || 0)) / 100;
  const discountAmountValue = discountAmountDraft
    ?? (billTotals ? String(billTotals.discountAmount) : (subtotal > 0 ? String(Math.round(calculatedDiscount * 100) / 100) : "0"));

  type TotalsPayload = { discount_percent: number | null; discount_amount: number | null; taxable_amount: number | null; vat_amount: number | null; grand_total: number | null };

  const createTransactionMutation = useMutation({
    mutationFn: ({ vendorUlid, payload }: { vendorUlid: string; payload: object }) =>
      apiFetch<{ data: { ulid: string } & TotalsPayload }>(
        `/acc-vendors/${vendorUlid}/transactions`, { method: "POST", body: JSON.stringify(payload) }
      ),
  });

  const addItemMutation = useMutation({
    mutationFn: ({ vendorUlid, txUlid, payload }: { vendorUlid: string; txUlid: string; payload: object }) =>
      apiFetch<{ data: { ulid: string; transaction: TotalsPayload } }>(
        `/acc-vendors/${vendorUlid}/transactions/${txUlid}/items`, { method: "POST", body: JSON.stringify(payload) }
      ),
  });

  const updateTotalsMutation = useMutation({
    mutationFn: ({ vendorUlid, txUlid, body }: { vendorUlid: string; txUlid: string; body: { discount_percent?: number; discount_amount?: number } }) =>
      apiFetch<{ data: TotalsPayload }>(
        `/acc-vendors/${vendorUlid}/transactions/${txUlid}/totals`, { method: "PATCH", body: JSON.stringify(body) }
      ),
  });

  const updateHeaderMutation = useMutation({
    mutationFn: ({ vendorUlid, txUlid, payload }: { vendorUlid: string; txUlid: string; payload: object }) =>
      apiFetch(`/acc-vendors/${vendorUlid}/transactions/${txUlid}`, { method: "PATCH", body: JSON.stringify(payload) }),
    onError: (err: any) => toast.error("Failed to update bill details", err?.message ?? "Something went wrong."),
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

  function saveHeader() {
    if (!selectedVendorUlid || !transactionUlid || !isValidBsDate(billDate)) return;
    updateHeaderMutation.mutate({
      vendorUlid: selectedVendorUlid,
      txUlid: transactionUlid,
      payload: { date: billDate, particular: "purchase", voucher_no: billNo || null },
    });
  }

  // Once a transaction is loaded for editing, keep totals synced with the server after item removals.
  useEffect(() => {
    if (!editTransactionParam || !transactionUlid) return;
    const tx = transactionsData?.data.find((t) => t.ulid === transactionUlid);
    if (!tx) return;
    setDiscountPercent(String(tx.discount_percent ?? 0));
    setBillTotals({
      discountAmount: tx.discount_amount ?? 0,
      taxableAmount: tx.taxable_amount ?? 0,
      vatAmount: tx.vat_amount ?? 0,
      grandTotal: tx.grand_total ?? 0,
    });
  }, [transactionsData, editTransactionParam, transactionUlid]);

  function applyTotalsResult(res: TotalsPayload) {
    setDiscountPercent(String(res.discount_percent ?? 0));
    setBillTotals({
      discountAmount: res.discount_amount ?? 0,
      taxableAmount: res.taxable_amount ?? 0,
      vatAmount: res.vat_amount ?? 0,
      grandTotal: res.grand_total ?? 0,
    });
  }

  async function saveDiscountPercent() {
    if (!selectedVendorUlid || !transactionUlid) return;
    const pct = Math.max(0, Math.min(100, Number(discountPercent) || 0));
    try {
      const res = await updateTotalsMutation.mutateAsync({ vendorUlid: selectedVendorUlid, txUlid: transactionUlid, body: { discount_percent: pct } });
      applyTotalsResult(res.data);
      setDiscountAmountDraft(null);
      queryClient.invalidateQueries({ queryKey: ["acc-vendors"] });
    } catch (err: any) {
      toast.error("Failed to update discount", err?.message ?? "Something went wrong.");
    }
  }

  async function saveDiscountAmount() {
    if (!selectedVendorUlid || !transactionUlid) return;
    const amount = Math.max(0, Number(discountAmountDraft) || 0);
    try {
      const res = await updateTotalsMutation.mutateAsync({ vendorUlid: selectedVendorUlid, txUlid: transactionUlid, body: { discount_amount: Math.round(amount) } });
      applyTotalsResult(res.data);
      setDiscountAmountDraft(null);
      queryClient.invalidateQueries({ queryKey: ["acc-vendors"] });
    } catch (err: any) {
      toast.error("Failed to update discount", err?.message ?? "Something went wrong.");
    }
  }

  function handleDiscountAmountChange(value: string) {
    setDiscountAmountDraft(value);
  }

  function handleDiscountAmountBlur() {
    saveDiscountAmount();
  }

  async function trySaveRow(key: number, overrides?: Partial<LineItem>) {
    if (!selectedVendorUlid || !isValidBsDate(billDate)) return;
    if (savingKeysRef.current.has(key)) return;

    const found = rows.find((r) => r.key === key);
    if (!found || found.saved) return;
    const row = overrides ? { ...found, ...overrides } : found;
    if (!row.productUlid || !row.quantity || Number(row.quantity) <= 0 || row.rate === "") return;

    savingKeysRef.current.add(key);
    try {
      const itemPayload = {
        product_ulid: row.productUlid,
        quantity: Number(row.quantity),
        rate: Number(row.rate),
        discount: rowDiscount(row),
      };
      let itemUlid: string | null = null;

      if (!transactionUlid) {
        const res = await createTransactionMutation.mutateAsync({
          vendorUlid: selectedVendorUlid,
          payload: {
            date: billDate,
            particular: "purchase",
            voucher_no: billNo || null,
            discount_percent: Math.max(0, Math.min(100, Number(discountPercent) || 0)),
            items: [itemPayload],
            fiscal_year_id: selectedFiscalYearId ?? undefined,
          },
        });
        transactionUlidRef.current = res.data.ulid;
        setTransactionUlid(res.data.ulid);
        applyTotalsResult(res.data);
      } else {
        const res = await addItemMutation.mutateAsync({ vendorUlid: selectedVendorUlid, txUlid: transactionUlid, payload: itemPayload });
        itemUlid = res.data.ulid;
        applyTotalsResult(res.data.transaction);
      }

      setRows((prev) => {
        const next = prev.map((r) => (r.key === key ? { ...r, saved: true, itemUlid } : r));
        const isLast = prev[prev.length - 1]?.key === key;
        return isLast ? [...next, emptyRow()] : next;
      });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["acc-vendors"] });
      toast.success("Item recorded", `${row.particular} has been added to this purchase.`);
    } catch (err: any) {
      toast.error("Failed to save item", err?.message ?? "Something went wrong.");
    } finally {
      savingKeysRef.current.delete(key);
    }
  }

  // Lets the receipt upload work even before the bill itself has any saved item — the
  // transaction only exists once a line item does, so this saves the first valid row first.
  async function ensureTransactionUlid(): Promise<string | null> {
    if (transactionUlidRef.current) return transactionUlidRef.current;
    const firstValidRow = rows.find((r) => !r.saved && r.productUlid && r.quantity && Number(r.quantity) > 0 && r.rate !== "");
    if (!firstValidRow) {
      toast.error("Add an item first", "Fill in at least one line item before attaching a receipt.");
      return null;
    }
    await trySaveRow(firstValidRow.key);
    return transactionUlidRef.current;
  }

  const inputCls = "w-full h-8 px-2 text-sm font-medium text-black border border-slate-300 focus:outline-none focus:border-slate-500 bg-white";

  return (
    <div className="flex gap-0 transition-all duration-300 h-full">
      <div className="flex-1 min-w-0 flex flex-col p-6 gap-6 h-full">
        <nav className="flex items-center gap-1.5 text-sm text-text-muted">
          <Link href="/admin" className="hover:text-text-default transition-colors">Dashboard</Link>
          <span>/</span>
          <Link href="/admin/accounts" className="hover:text-text-default transition-colors">Accounts</Link>
          <span>/</span>
          <span className="text-text-default font-medium">Goods Purchased</span>
        </nav>

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-h3 font-bold text-text-default">{editTransactionParam ? "Edit Goods Purchased" : "Goods Purchased"}</h2>
            <p className="text-sm text-text-muted mt-0.5">{editTransactionParam ? "Update items purchased from a vendor." : "Record items purchased from a vendor."}</p>
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
          <VendorSidebar
            vendors={vendors}
            vendorsLoading={vendorsLoading}
            activeFiscalYearId={activeFiscalYearId}
            selectedVendorUlid={selectedVendor?.ulid}
            search={sideSearch}
            onSearchChange={setSideSearch}
            onSelect={(vendor) => selectVendor(vendor.ulid)}
          />

          {/* Right side: detail card + line item table */}
          <div className="flex-1 min-w-0 flex flex-col gap-4 self-start">
            {/* Account detail card */}
            <div className="bg-white px-5 py-4 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <VendorInfoBlock vendor={selectedVendor} />

                <div className="flex flex-col gap-2 shrink-0 w-48">
                  {fiscalYears.length > 0 && (
                    <select
                      value={selectedFiscalYearId ?? ""}
                      onChange={(e) => setSelectedFiscalYearId(Number(e.target.value))}
                      disabled={!!transactionUlid}
                      title={transactionUlid ? "Fiscal year is locked once the bill has an item" : "Fiscal year this bill is recorded against"}
                      className="w-full h-8 px-2 text-sm font-medium text-black border border-slate-300 focus:outline-none focus:border-slate-500 bg-white disabled:bg-slate-100 disabled:text-text-muted"
                    >
                      {fiscalYears.map((fy) => (
                        <option key={fy.id} value={fy.id}>
                          {fy.name}
                        </option>
                      ))}
                    </select>
                  )}
                  <input
                    type="text"
                    value={billNo}
                    onChange={(e) => setBillNo(e.target.value)}
                    onBlur={saveHeader}
                    placeholder="Bill no..."
                    className="w-full h-8 px-2 text-sm font-medium text-black border border-slate-300 focus:outline-none focus:border-slate-500 bg-white disabled:bg-slate-100 disabled:text-text-muted"
                  />
                  <BsDateInput value={billDate} onChange={setBillDate} onBlur={saveHeader} />
                </div>
              </div>
            </div>

            {/* Line item table */}
            <div className="border border-slate-300 bg-white flex flex-col overflow-x-auto">
              <div className="grid grid-cols-[50px_1fr_170px_160px_130px_100px_50px] min-w-[909px] bg-black">
                <span className="px-3 py-2.5 text-xs font-semibold text-white uppercase tracking-wide">S.N.</span>
                <span className="px-3 py-2.5 text-xs font-semibold text-white uppercase tracking-wide">Particulars (Name of Stock)</span>
                <span className="px-3 py-2.5 text-xs font-semibold text-white uppercase tracking-wide">Quantity</span>
                <span className="px-3 py-2.5 text-xs font-semibold text-white uppercase tracking-wide">Rate</span>
                <span className="px-3 py-2.5 text-xs font-semibold text-white uppercase tracking-wide">Discount</span>
                <span className="px-3 py-2.5 text-xs font-semibold text-white uppercase tracking-wide">Amount</span>
                <span></span>
              </div>

              {rows.map((row, idx) => (
                <div
                  key={row.key}
                  onBlur={(e) => {
                    if (!row.saved && !e.currentTarget.contains(e.relatedTarget as Node)) trySaveRow(row.key);
                  }}
                  className="grid grid-cols-[50px_1fr_170px_160px_130px_100px_50px] min-w-[909px] border-b border-slate-200 items-center"
                >
                  <span className="px-3 py-2 text-sm font-medium text-black">{idx + 1}</span>

                  {row.saved ? (
                    <>
                      <span className="px-3 py-2 text-sm font-medium text-black truncate flex items-center gap-1.5">
                        {row.particular}
                        <Check className="h-3.5 w-3.5 text-green-600 shrink-0" />
                      </span>
                      <span className="px-3 py-2 text-sm font-medium text-black">{row.quantity}</span>
                      <span className="px-3 py-2 text-sm font-medium text-black">{Number(row.rate).toLocaleString()}</span>
                    </>
                  ) : (
                    <>
                      <div className="px-3 py-1.5 [&_input]:h-8 [&_input]:text-sm [&_input]:font-medium [&_input]:text-black [&_.mt-1]:mt-0">
                        <ProductCombobox
                          placeholder="Select a product..."
                          value={row.productUlid}
                          onChange={(val, product) => {
                            selectProduct(row.key, val, product);
                            const rate = suggestedRate(product);
                            trySaveRow(row.key, { productUlid: val, rate: rate != null ? String(rate) : row.rate });
                          }}
                          onAddNew={(query) => { setCreateProductRowKey(row.key); setCreateProductQuery(query); }}
                        />
                      </div>
                      <div className="px-3 py-1.5">
                        <input
                          type="number"
                          min="0"
                          name={`quantity-${row.key}`}
                          autoComplete="off"
                          value={row.quantity}
                          onChange={(e) => updateRow(row.key, "quantity", e.target.value)}
                          placeholder="0"
                          className={`${inputCls}`}
                        />
                      </div>
                      <div className="px-3 py-1.5">
                        <input
                          type="number"
                          min="0"
                          name={`rate-${row.key}`}
                          autoComplete="off"
                          value={row.rate}
                          onChange={(e) => updateRow(row.key, "rate", e.target.value)}
                          placeholder="0.00"
                          className={`${inputCls}`}
                        />
                      </div>
                    </>
                  )}

                  {row.saved ? (
                    <span className="px-3 py-2 text-sm font-medium text-black">{rowDiscount(row).toLocaleString()}</span>
                  ) : (
                    <div className="px-3 py-1.5">
                      <input
                        type="number"
                        min="0"
                        name={`discount-${row.key}`}
                        autoComplete="off"
                        value={row.discount}
                        onChange={(e) => updateRow(row.key, "discount", e.target.value)}
                        placeholder="0"
                        className={`${inputCls}`}
                      />
                    </div>
                  )}

                  <span className="px-3 py-2 text-sm font-medium text-black">
                    {rowAmount(row) ? rowAmount(row).toLocaleString() : "—"}
                  </span>

                  <button
                    onClick={() => removeRow(row.key)}
                    disabled={rows.length === 1 && !row.saved}
                    className="flex items-center justify-center h-full py-2 text-text-muted hover:text-red-600 disabled:opacity-30 disabled:hover:text-text-muted transition-colors cursor-pointer disabled:cursor-not-allowed"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}

              <div className="px-4 py-2.5 flex items-center min-w-[909px]">
                <button
                  onClick={addRow}
                  className="flex items-center gap-1.5 text-sm font-semibold text-text-default hover:text-black transition-colors cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Row
                </button>
              </div>

              {/* Totals breakdown — aligned with table columns: words (col 1-2) · total quantity (col 3: quantity) · breakdown (col 4-7) */}
              <div className="grid grid-cols-[50px_1fr_170px_160px_130px_100px_50px] min-w-[909px] border-t border-slate-100">
                <div className="col-span-2 px-4 py-3">
                  <p className="text-xs font-semibold text-text-default uppercase tracking-wide mb-0">Amount In Words</p>
                  <p className="text-sm-custom text-text-body leading-tight">{numberToWords(grandTotalValue)} Only</p>
                </div>

                <div className="px-3 py-3 border-l border-slate-100 flex items-baseline gap-1.5">
                  <span className="text-sm-custom text-text-body">Total Quantity</span>
                  <span className="text-sm-custom font-semibold text-text-default">
                    {totalQuantity ? totalQuantity.toLocaleString() : "0"}
                  </span>
                </div>

                <div className="col-span-4 border-l border-slate-100">
                  <div className="w-72 ml-auto">
                    <div className="flex items-center justify-between px-4 py-1.5 border-b border-slate-100">
                      <span className="text-sm-custom text-text-body">Total</span>
                      <span className="text-sm-custom font-semibold text-text-default">{subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-1.5 border-b border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm-custom text-text-body">Discount</span>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={discountPercent}
                          onChange={(e) => {
                            setDiscountPercent(e.target.value);
                            setDiscountAmountDraft(null);
                          }}
                          onBlur={saveDiscountPercent}
                          className="w-12 h-7 px-1.5 text-sm font-medium text-black text-right border border-slate-300 focus:outline-none focus:border-slate-500 bg-white disabled:bg-slate-100 disabled:text-text-muted"
                        />
                        <span className="text-sm-custom text-text-body shrink-0">%</span>
                      </div>
                      <input
                        type="number"
                        min="0"
                        value={discountAmountValue}
                        onChange={(e) => handleDiscountAmountChange(e.target.value)}
                        onBlur={handleDiscountAmountBlur}
                        placeholder="Amount"
                        className="w-20 h-7 px-1.5 text-sm font-medium text-black text-right border border-slate-300 focus:outline-none focus:border-slate-500 bg-white disabled:bg-slate-100 disabled:text-text-muted"
                      />
                    </div>
                    <div className="flex items-center justify-between px-4 py-1.5 border-b border-slate-100">
                      <span className="text-sm-custom text-text-body">Taxable Amount</span>
                      <span className="text-sm-custom font-semibold text-text-default">{(billTotals?.taxableAmount ?? subtotal).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-1.5 border-b border-slate-100">
                      <span className="text-sm-custom text-text-body">VAT 13%</span>
                      <span className="text-sm-custom font-semibold text-text-default">{(billTotals?.vatAmount ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-2 bg-slate-50">
                      <span className="text-sm-custom font-bold text-text-default">Grand Total</span>
                      <span className="text-sm-custom font-bold text-text-default">{grandTotalValue.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-4 py-3 border-t border-slate-100 max-w-xs">
                <MultiImageUpload
                  label="Bill Photo"
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

              <div className="flex items-center justify-end px-4 py-3 border-t border-slate-100">
                <button
                  onClick={() => router.push(selectedVendor ? `/admin/accounts?vendor=${selectedVendor.ulid}` : "/admin/accounts")}
                  className="px-6 py-2 text-sm font-semibold text-text-default border border-slate-300 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    toast.success("Purchase recorded", "The bill has been saved.");
                    router.push(selectedVendor ? `/admin/accounts?vendor=${selectedVendor.ulid}` : "/admin/accounts");
                  }}
                  className="px-6 py-2 text-sm font-semibold text-white bg-black hover:bg-black/80 transition-colors cursor-pointer"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <CreateProductPanel
        open={createProductRowKey !== null}
        onClose={() => setCreateProductRowKey(null)}
        initialName={createProductQuery}
        onCreated={(product) => {
          if (createProductRowKey !== null) {
            selectProduct(createProductRowKey, product.ulid, product);
            const rate = suggestedRate(product);
            trySaveRow(createProductRowKey, {
              productUlid: product.ulid,
              ...(rate != null ? { rate: String(rate) } : {}),
            });
          }
          setCreateProductRowKey(null);
        }}
      />
    </div>
  );
}

export default function GoodsPurchasedPage() {
  return (
    <Suspense fallback={null}>
      <GoodsPurchasedContent />
    </Suspense>
  );
}
