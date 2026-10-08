"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2, Plus } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { toast } from "@/lib/toast";
import { BsDateInput, getTodayBs, isValidBsDate } from "@/components/ui/form/BsDateInput";
import { numberToWords } from "@/lib/numberToWords";
import { ProductCombobox, ProductOption } from "@/components/products/ProductCombobox";
import { CreateProductPanel } from "@/components/products/CreateProductPanel";
import { CustomerInfoBlock } from "../../customers/_components/CustomerInfoBlock";
import { Customer } from "../../customers/_components/types";
import { CustomerFormPanel, CustomerFormState, CustomerFormErrors } from "../../customers/_components/CustomerFormPanel";

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
  sort_order: number;
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

type QuoteTotals = {
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

type SavedQuotation = {
  ulid: string;
  fiscal_year_id: number | null;
  date: string;
  voucher_no: string | null;
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

type QuotationFormProps = {
  /** Pre-selects a customer, e.g. when opened from that customer's own page. */
  initialCustomerUlid?: string | null;
  /** Loads an existing quotation for editing. */
  initialQuotationUlid?: string | null;
  /** Called when the user is done (Cancel/Save/Back) — the host decides what to show next. */
  onExit: () => void;
};

export function QuotationForm({ initialCustomerUlid = null, initialQuotationUlid = null, onExit }: QuotationFormProps) {
  const queryClient = useQueryClient();

  const [selectedCustomerUlid, setSelectedCustomerUlid] = useState<string | null>(initialCustomerUlid);
  const [rows, setRows] = useState<LineItem[]>([emptyRow()]);
  const [quoteDate, setQuoteDate] = useState(getTodayBs);
  const [quoteNo, setQuoteNo] = useState("");
  const [quotationUlid, setQuotationUlid] = useState<string | null>(null);
  const [selectedFiscalYearId, setSelectedFiscalYearId] = useState<number | null>(null);
  const quotationUlidRef = useRef<string | null>(null);
  const [discountPercent, setDiscountPercent] = useState("0");
  const [discountAmountDraft, setDiscountAmountDraft] = useState<string | null>(null);
  const [quoteTotals, setQuoteTotals] = useState<QuoteTotals | null>(null);
  const [createProductRowKey, setCreateProductRowKey] = useState<number | null>(null);
  const [createProductQuery, setCreateProductQuery] = useState("");
  const savingKeysRef = useRef<Set<number>>(new Set());
  const loadedQuotationRef = useRef<string | null>(null);

  const CUSTOMER_INITIAL_FORM: CustomerFormState = { name: "", address: "", phone: "", telephone: "", vat_no: "", fiscal_year_id: "", opening_balance: "" };
  const [customerPanelOpen, setCustomerPanelOpen] = useState(false);
  const [customerForm, setCustomerForm] = useState<CustomerFormState>(CUSTOMER_INITIAL_FORM);
  const [customerErrors, setCustomerErrors] = useState<CustomerFormErrors>({});

  const { data: customersData, isLoading: customersLoading } = useQuery({
    queryKey: ["acc-customers"],
    queryFn: () => apiFetch<{ data: Customer[]; meta: Meta }>("/acc-customers?per_page=100"),
  });

  const createCustomerMutation = useMutation({
    mutationFn: (payload: { name: string; address: string | null; phone: string | null; telephone: string | null; vat_no: string | null }) =>
      apiFetch<{ data: Customer }>("/acc-customers", { method: "POST", body: JSON.stringify(payload) }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["acc-customers"] });
      toast.success("Customer created", `"${res.data.name}" has been added.`);
      setCustomerPanelOpen(false);
      setCustomerForm(CUSTOMER_INITIAL_FORM);
      setSelectedCustomerUlid(res.data.ulid);
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

  const customers = customersData?.data ?? [];
  const selectedCustomer = customers.find((c) => c.ulid === selectedCustomerUlid) ?? null;

  const { data: quotationsData } = useQuery({
    queryKey: ["acc-quotations", selectedCustomer?.ulid],
    queryFn: () => apiFetch<{ data: SavedQuotation[] }>(`/acc-customers/${selectedCustomer!.ulid}/quotations`),
    enabled: !!selectedCustomer && !!initialQuotationUlid,
  });

  // Reacting to the customer selection changing. Two distinct cases:
  //  - First pick (prev === null): the user may have already filled in items before choosing a
  //    customer (trySaveRow couldn't save them yet without one) — save whatever's complete now,
  //    and leave the draft otherwise untouched.
  //  - Swapping to a *different* already-selected customer: that other customer's draft doesn't
  //    carry over, so start a fresh quote instead.
  const prevCustomerUlidRef = useRef<string | null>(initialCustomerUlid);
  useEffect(() => {
    const prev = prevCustomerUlidRef.current;
    prevCustomerUlidRef.current = selectedCustomerUlid;
    if (initialQuotationUlid || prev === selectedCustomerUlid) return;

    if (!prev) {
      rows.forEach((row) => {
        if (!row.saved && row.productUlid && row.quantity && Number(row.quantity) > 0 && row.rate !== "") {
          trySaveRow(row.key);
        }
      });
      return;
    }

    setRows([emptyRow()]);
    quotationUlidRef.current = null;
    setQuotationUlid(null);
    setQuoteDate(getTodayBs());
    setQuoteNo("");
    setDiscountPercent("0");
    setDiscountAmountDraft(null);
    setQuoteTotals(null);
    setSelectedFiscalYearId(activeFiscalYearId);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to the customer selection changing
  }, [selectedCustomerUlid]);

  useEffect(() => {
    if (selectedFiscalYearId === null && activeFiscalYearId !== null && !quotationUlid) {
      setSelectedFiscalYearId(activeFiscalYearId);
    }
  }, [activeFiscalYearId, selectedFiscalYearId, quotationUlid]);

  // Load the existing quotation into the form once, when editing.
  useEffect(() => {
    if (!initialQuotationUlid || loadedQuotationRef.current === initialQuotationUlid) return;
    const q = quotationsData?.data.find((item) => item.ulid === initialQuotationUlid);
    if (!q) return;
    loadedQuotationRef.current = initialQuotationUlid;
    quotationUlidRef.current = q.ulid;
    setQuotationUlid(q.ulid);
    setSelectedFiscalYearId(q.fiscal_year_id);
    setQuoteDate(q.date);
    setQuoteNo(q.voucher_no ?? "");
    setDiscountPercent(String(q.discount_percent ?? 0));
    setQuoteTotals({
      discountAmount: q.discount_amount ?? 0,
      taxableAmount: q.taxable_amount ?? 0,
      vatAmount: q.vat_amount ?? 0,
      grandTotal: q.grand_total ?? 0,
    });
    const savedRows: LineItem[] = q.items.map((it) => ({
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
  }, [initialQuotationUlid, quotationsData]);

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

  function invalidateQuotations(customerUlid: string) {
    queryClient.invalidateQueries({ queryKey: ["acc-quotations", customerUlid] });
    queryClient.invalidateQueries({ queryKey: ["quotations"] });
    queryClient.invalidateQueries({ queryKey: ["acc-customers"] });
  }

  function removeRow(key: number) {
    const row = rows.find((r) => r.key === key);
    if (!row) return;
    if (row.saved && row.itemUlid) {
      if (!selectedCustomerUlid || !quotationUlid) return;
      if (!confirm("Delete this line item?")) return;
      deleteItemMutation.mutate(
        { customerUlid: selectedCustomerUlid, quotationUlid, itemUlid: row.itemUlid },
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
  const grandTotalValue = quoteTotals?.grandTotal ?? subtotal;

  const calculatedDiscount = (subtotal * (Number(discountPercent) || 0)) / 100;
  const discountAmountValue = discountAmountDraft
    ?? (quoteTotals ? String(quoteTotals.discountAmount) : (subtotal > 0 ? String(Math.round(calculatedDiscount * 100) / 100) : "0"));

  type TotalsPayload = { discount_percent: number | null; discount_amount: number | null; taxable_amount: number | null; vat_amount: number | null; grand_total: number | null };

  const createQuotationMutation = useMutation({
    mutationFn: ({ customerUlid, payload }: { customerUlid: string; payload: object }) =>
      apiFetch<{ data: { ulid: string } & TotalsPayload }>(
        `/acc-customers/${customerUlid}/quotations`, { method: "POST", body: JSON.stringify(payload) }
      ),
    onSuccess: (_data, variables) => invalidateQuotations(variables.customerUlid),
  });

  const addItemMutation = useMutation({
    mutationFn: async ({ customerUlid, quotationUlid, payload }: { customerUlid: string; quotationUlid: string; payload: object }) => {
      const res = await apiFetch<{ data: { ulid: string } }>(
        `/acc-customers/${customerUlid}/quotations/${quotationUlid}/items`, { method: "POST", body: JSON.stringify(payload) }
      );
      const list = await apiFetch<{ data: SavedQuotation[] }>(`/acc-customers/${customerUlid}/quotations`);
      const quotation = list.data.find((q) => q.ulid === quotationUlid);
      return { ulid: res.data.ulid, quotation };
    },
    onSuccess: (_data, variables) => invalidateQuotations(variables.customerUlid),
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ customerUlid, quotationUlid, itemUlid, payload }: { customerUlid: string; quotationUlid: string; itemUlid: string; payload: object }) =>
      apiFetch<{ data: { ulid: string } }>(
        `/acc-customers/${customerUlid}/quotations/${quotationUlid}/items/${itemUlid}`, { method: "PATCH", body: JSON.stringify(payload) }
      ),
    onSuccess: (_data, variables) => invalidateQuotations(variables.customerUlid),
  });

  const updateTotalsMutation = useMutation({
    mutationFn: ({ customerUlid, quotationUlid, body }: { customerUlid: string; quotationUlid: string; body: { discount_percent?: number; discount_amount?: number } }) =>
      apiFetch<{ data: TotalsPayload }>(
        `/acc-customers/${customerUlid}/quotations/${quotationUlid}/totals`, { method: "PATCH", body: JSON.stringify(body) }
      ),
    onSuccess: (_data, variables) => invalidateQuotations(variables.customerUlid),
  });

  const updateHeaderMutation = useMutation({
    mutationFn: ({ customerUlid, quotationUlid, payload }: { customerUlid: string; quotationUlid: string; payload: object }) =>
      apiFetch(`/acc-customers/${customerUlid}/quotations/${quotationUlid}`, { method: "PATCH", body: JSON.stringify(payload) }),
    onSuccess: (_data, variables) => invalidateQuotations(variables.customerUlid),
    onError: (err: any) => toast.error("Failed to update quotation details", err?.message ?? "Something went wrong."),
  });

  const deleteItemMutation = useMutation({
    mutationFn: ({ customerUlid, quotationUlid, itemUlid }: { customerUlid: string; quotationUlid: string; itemUlid: string }) =>
      apiFetch(`/acc-customers/${customerUlid}/quotations/${quotationUlid}/items/${itemUlid}`, { method: "DELETE" }),
    onSuccess: (_data, variables) => {
      invalidateQuotations(variables.customerUlid);
      toast.success("Item removed", "The line item has been deleted.");
    },
    onError: (err: any) => toast.error("Failed to delete item", err?.message ?? "Something went wrong."),
  });

  function saveHeader() {
    if (!selectedCustomerUlid || !quotationUlid || !isValidBsDate(quoteDate)) return;
    updateHeaderMutation.mutate({
      customerUlid: selectedCustomerUlid,
      quotationUlid,
      payload: { date: quoteDate, voucher_no: quoteNo || null },
    });
  }

  useEffect(() => {
    if (!initialQuotationUlid || !quotationUlid) return;
    const q = quotationsData?.data.find((item) => item.ulid === quotationUlid);
    if (!q) return;
    setDiscountPercent(String(q.discount_percent ?? 0));
    setQuoteTotals({
      discountAmount: q.discount_amount ?? 0,
      taxableAmount: q.taxable_amount ?? 0,
      vatAmount: q.vat_amount ?? 0,
      grandTotal: q.grand_total ?? 0,
    });
  }, [quotationsData, initialQuotationUlid, quotationUlid]);

  function applyTotalsResult(res: TotalsPayload) {
    setDiscountPercent(String(res.discount_percent ?? 0));
    setQuoteTotals({
      discountAmount: res.discount_amount ?? 0,
      taxableAmount: res.taxable_amount ?? 0,
      vatAmount: res.vat_amount ?? 0,
      grandTotal: res.grand_total ?? 0,
    });
  }

  async function saveDiscountPercent() {
    if (!selectedCustomerUlid || !quotationUlid) return;
    const pct = Math.max(0, Math.min(100, Number(discountPercent) || 0));
    try {
      const res = await updateTotalsMutation.mutateAsync({ customerUlid: selectedCustomerUlid, quotationUlid, body: { discount_percent: pct } });
      applyTotalsResult(res.data);
      setDiscountAmountDraft(null);
    } catch (err: any) {
      toast.error("Failed to update discount", err?.message ?? "Something went wrong.");
    }
  }

  async function saveDiscountAmount() {
    if (!selectedCustomerUlid || !quotationUlid) return;
    const amount = Math.max(0, Number(discountAmountDraft) || 0);
    try {
      const res = await updateTotalsMutation.mutateAsync({ customerUlid: selectedCustomerUlid, quotationUlid, body: { discount_amount: Math.round(amount) } });
      applyTotalsResult(res.data);
      setDiscountAmountDraft(null);
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
    if (!selectedCustomerUlid || !isValidBsDate(quoteDate)) return;
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
      let itemUlid: string | null = row.itemUlid;
      const isUpdate = !!(row.itemUlid && quotationUlid);

      if (isUpdate && quotationUlid && row.itemUlid) {
        await updateItemMutation.mutateAsync({ customerUlid: selectedCustomerUlid, quotationUlid, itemUlid: row.itemUlid, payload: itemPayload });
        const list = await apiFetch<{ data: SavedQuotation[] }>(`/acc-customers/${selectedCustomerUlid}/quotations`).catch(() => null);
        const refreshed = list?.data.find((q) => q.ulid === quotationUlid);
        if (refreshed) applyTotalsResult(refreshed);
      } else if (!quotationUlid) {
        const res = await createQuotationMutation.mutateAsync({
          customerUlid: selectedCustomerUlid,
          payload: {
            date: quoteDate,
            voucher_no: quoteNo || null,
            discount_percent: Math.max(0, Math.min(100, Number(discountPercent) || 0)),
            items: [itemPayload],
            fiscal_year_id: selectedFiscalYearId ?? undefined,
          },
        });
        quotationUlidRef.current = res.data.ulid;
        setQuotationUlid(res.data.ulid);
        applyTotalsResult(res.data);
      } else {
        const res = await addItemMutation.mutateAsync({ customerUlid: selectedCustomerUlid, quotationUlid, payload: itemPayload });
        itemUlid = res.ulid;
        if (res.quotation) applyTotalsResult(res.quotation);
      }

      setRows((prev) => {
        const next = prev.map((r) => (r.key === key ? { ...r, saved: true, itemUlid } : r));
        const isLast = prev[prev.length - 1]?.key === key;
        return isLast ? [...next, emptyRow()] : next;
      });
      toast.success(isUpdate ? "Item updated" : "Item recorded", `${row.particular} has been ${isUpdate ? "updated" : "added to this quote"}.`);
    } catch (err: any) {
      toast.error("Failed to save item", err?.message ?? "Something went wrong.");
    } finally {
      savingKeysRef.current.delete(key);
    }
  }

  const inputCls = "w-full h-full px-3 text-sm text-black bg-white border-0 focus:outline-none focus:ring-1 focus:ring-inset focus:ring-slate-400 placeholder:text-text-muted";

  return (
    <div className="flex h-full min-h-0 w-full">
      {/* Visible content stack. The modals below render always-present (if closed, zero-width)
          elements — nesting them here as a flex ROW sibling, rather than as direct children of
          this flex-COLUMN content stack, keeps them from competing for vertical space and
          crushing the items table to zero height. */}
      <div className="flex-1 min-w-0 flex flex-col gap-4 h-full min-h-0">
      {/* Customer detail card */}
      <div className="bg-white px-5 py-4 space-y-3">
        <div className="flex items-center justify-between gap-4">
          <CustomerInfoBlock
            customer={selectedCustomer}
            customers={customers}
            onSelectCustomer={setSelectedCustomerUlid}
            onAddNewCustomer={(query) => {
              setCustomerForm({ ...CUSTOMER_INITIAL_FORM, name: query, fiscal_year_id: activeFiscalYearId ? String(activeFiscalYearId) : "" });
              setCustomerErrors({});
              setCustomerPanelOpen(true);
            }}
          />

          <div className="flex items-start gap-2 shrink-0">
            <div className="flex flex-col gap-2 w-48">
              <input
                type="text"
                value={quoteNo}
                onChange={(e) => setQuoteNo(e.target.value)}
                onBlur={() => saveHeader()}
                placeholder="Quote no..."
                className="w-full h-8 px-2 text-sm font-medium text-black border border-slate-300 focus:outline-none focus:border-slate-500 bg-white disabled:bg-slate-100 disabled:text-text-muted"
              />
              <BsDateInput value={quoteDate} onChange={setQuoteDate} onBlur={() => saveHeader()} />
            </div>
          </div>
        </div>
      </div>

        {/* Line item table + footer group */}
        <div className="flex-1 min-h-0 flex flex-col">
            <div className="flex-1 min-h-0 border border-slate-300 bg-white flex flex-col overflow-auto">
              <div className="grid grid-cols-[50px_1fr_170px_160px_130px_100px_50px] min-w-[909px] bg-black">
                <span className="px-3 py-2.5 text-xs font-semibold text-white uppercase tracking-wide">S.N.</span>
                <span className="px-3 py-2.5 text-xs font-semibold text-white uppercase tracking-wide border-l border-white/20">Particulars (Name of Stock)</span>
                <span className="px-3 py-2.5 text-xs font-semibold text-white uppercase tracking-wide border-l border-white/20">Quantity</span>
                <span className="px-3 py-2.5 text-xs font-semibold text-white uppercase tracking-wide border-l border-white/20">Rate</span>
                <span className="px-3 py-2.5 text-xs font-semibold text-white uppercase tracking-wide border-l border-white/20">Discount</span>
                <span className="px-3 py-2.5 text-xs font-semibold text-white uppercase tracking-wide border-l border-white/20">Amount</span>
                <span></span>
              </div>

              {rows.map((row, idx) => (
                <div
                  key={row.key}
                  onBlur={(e) => {
                    if (!row.saved && !e.currentTarget.contains(e.relatedTarget as Node)) trySaveRow(row.key);
                  }}
                  onDoubleClick={() => {
                    if (row.saved) setRows((prev) => prev.map((r) => (r.key === row.key ? { ...r, saved: false } : r)));
                  }}
                  className="grid grid-cols-[50px_1fr_170px_160px_130px_100px_50px] min-w-[909px] border-b border-[#b0bccc] items-stretch"
                >
                  <span className="px-3 py-2 text-sm font-medium text-black flex items-center">{idx + 1}</span>

                  {row.saved ? (
                    <>
                      <span className="px-3 py-2 text-sm font-medium text-black truncate cursor-pointer flex items-center border-l border-[#b0bccc]" title="Double-click to edit">
                        {row.particular}
                      </span>
                      <span className="px-3 py-2 text-sm font-medium text-black cursor-pointer flex items-center border-l border-[#b0bccc]" title="Double-click to edit">{row.quantity}</span>
                      <span className="px-3 py-2 text-sm font-medium text-black cursor-pointer flex items-center border-l border-[#b0bccc]" title="Double-click to edit">{Number(row.rate).toLocaleString()}</span>
                    </>
                  ) : (
                    <>
                      <div className="border-l border-[#b0bccc] [&_input]:h-full [&_input]:px-3 [&_input]:text-sm [&_input]:text-black [&_input]:bg-white [&_input]:border-0 [&_input]:rounded-none [&_input]:focus:outline-none [&_input]:focus:ring-1 [&_input]:focus:ring-inset [&_input]:focus:ring-slate-400 [&_.mt-1]:mt-0">
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
                      <div className="border-l border-[#b0bccc]">
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
                      <div className="border-l border-[#b0bccc]">
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
                    <span className="px-3 py-2 text-sm font-medium text-black cursor-pointer flex items-center border-l border-[#b0bccc]" title="Double-click to edit">{rowDiscount(row).toLocaleString()}</span>
                  ) : (
                    <div className="border-l border-[#b0bccc]">
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

                  <span className="px-3 py-2 text-sm font-medium text-black border-l border-[#b0bccc] flex items-center">
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

              <div className="px-4 py-2.5 flex items-center min-w-[909px] border-b border-[#b0bccc]">
                <button
                  onClick={addRow}
                  className="flex items-center gap-1.5 text-sm font-semibold text-text-default hover:text-black transition-colors cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Row
                </button>
              </div>

              {/* Totals breakdown */}
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
                      <span className="text-sm-custom font-semibold text-text-default">{(quoteTotals?.taxableAmount ?? subtotal).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-1.5 border-b border-slate-100">
                      <span className="text-sm-custom text-text-body">VAT 13%</span>
                      <span className="text-sm-custom font-semibold text-text-default">{(quoteTotals?.vatAmount ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-2 bg-slate-50">
                      <span className="text-sm-custom font-bold text-text-default">Grand Total</span>
                      <span className="text-sm-custom font-bold text-text-default">{grandTotalValue.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Fixed footer */}
            <div className="flex items-center justify-end px-4 py-3 mt-3 bg-white shrink-0">
              <button
                onClick={onExit}
                className="px-6 py-2 text-sm font-semibold text-text-default border border-slate-300 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  toast.success("Quotation saved", "The quotation has been saved.");
                  onExit();
                }}
                className="px-6 py-2 text-sm font-semibold text-white bg-black hover:bg-black/80 transition-colors cursor-pointer"
              >
                Save
              </button>
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
    </div>
  );
}
