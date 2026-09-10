"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MapPin, Phone, Receipt, Search, Trash2, Plus, ArrowLeft, ListOrdered, Check } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { toast } from "@/lib/toast";
import { BsDateInput, getTodayBs, isValidBsDate } from "@/components/ui/form/BsDateInput";
import { numberToWords } from "@/lib/numberToWords";
import { ProductCombobox, ProductOption } from "@/components/products/ProductCombobox";
import { CreateProductPanel } from "@/components/products/CreateProductPanel";

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

let nextKey = 1;

function emptyRow(): LineItem {
  return { key: nextKey++, productUlid: "", particular: "", quantity: "", rate: "", discount: "0", saved: false, itemUlid: null };
}


function GoodsPurchasedContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const vendorParam = searchParams.get("vendor");
  const queryClient = useQueryClient();

  const [sideSearch, setSideSearch] = useState("");
  const [selectedVendorUlid, setSelectedVendorUlid] = useState<string | null>(vendorParam);
  const [rows, setRows] = useState<LineItem[]>([emptyRow()]);
  const [billDate, setBillDate] = useState(getTodayBs);
  const [billNo, setBillNo] = useState("");
  const [transactionUlid, setTransactionUlid] = useState<string | null>(null);
  const [discountPercent, setDiscountPercent] = useState("0");
  const [discountAmountDraft, setDiscountAmountDraft] = useState<string | null>(null);
  const [billTotals, setBillTotals] = useState<BillTotals | null>(null);
  const [createProductRowKey, setCreateProductRowKey] = useState<number | null>(null);
  const [createProductQuery, setCreateProductQuery] = useState("");
  const savingKeysRef = useRef<Set<number>>(new Set());

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

  // Starting a fresh bill whenever the vendor changes — previous vendor's draft/transaction doesn't carry over.
  useEffect(() => {
    setRows([emptyRow()]);
    setTransactionUlid(null);
    setBillDate(getTodayBs());
    setBillNo("");
    setDiscountPercent("0");
    setDiscountAmountDraft(null);
    setBillTotals(null);
  }, [selectedVendorUlid]);

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
          },
        });
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
            <h2 className="text-h3 font-bold text-text-default">Goods Purchased</h2>
            <p className="text-sm text-text-muted mt-0.5">Record items purchased from a vendor.</p>
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

          {/* Right side: detail card + line item table */}
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

                <div className="flex flex-col gap-2 shrink-0 w-48">
                  <input
                    type="text"
                    value={billNo}
                    onChange={(e) => setBillNo(e.target.value)}
                    disabled={!!transactionUlid}
                    placeholder="Bill no..."
                    className="w-full h-8 px-2 text-sm font-medium text-black border border-slate-300 focus:outline-none focus:border-slate-500 bg-white disabled:bg-slate-100 disabled:text-text-muted"
                  />
                  <BsDateInput value={billDate} onChange={setBillDate} disabled={!!transactionUlid} />
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
                          className={`${inputCls} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
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
                          className={`${inputCls} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
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
                        className={`${inputCls} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                      />
                    </div>
                  )}

                  <span className="px-3 py-2 text-sm font-medium text-black">
                    {rowAmount(row) ? rowAmount(row).toLocaleString() : "—"}
                  </span>

                  <button
                    onClick={() => removeRow(row.key)}
                    disabled={rows.length === 1 || row.saved}
                    title={row.saved ? "Already recorded" : undefined}
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
                          className="w-12 h-7 px-1.5 text-sm font-medium text-black text-right border border-slate-300 focus:outline-none focus:border-slate-500 bg-white disabled:bg-slate-100 disabled:text-text-muted [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
                        className="w-20 h-7 px-1.5 text-sm font-medium text-black text-right border border-slate-300 focus:outline-none focus:border-slate-500 bg-white disabled:bg-slate-100 disabled:text-text-muted [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
