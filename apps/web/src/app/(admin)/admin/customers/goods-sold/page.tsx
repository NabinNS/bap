"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2, Plus, ArrowLeft, ListOrdered } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { toast } from "@/lib/toast";
import { BsDateInput, getTodayBs, isValidBsDate } from "@/components/ui/form/BsDateInput";
import { numberToWords } from "@/lib/numberToWords";
import { ProductCombobox, ProductOption } from "@/components/products/ProductCombobox";
import { CreateProductPanel } from "@/components/products/CreateProductPanel";
import { MultiImageUpload } from "@/components/ui/form/MultiImageUpload";
import { useImageGroup } from "@/hooks/useImageGroup";
import { CustomerSidebar } from "../_components/CustomerSidebar";
import { CustomerInfoBlock } from "../_components/CustomerInfoBlock";
import { TrashedItemsModal } from "../../accounts/_components/TrashedItemsModal";
import { useInvalidateCustomerTransactions } from "../../accounts/_components/useAccountingInvalidation";
import { Customer } from "../_components/types";
import { StockSidebar } from "../../products/_components/StockSidebar";
import { CustomerFormPanel, CustomerFormState, CustomerFormErrors } from "../_components/CustomerFormPanel";
import { TrashedCustomersModal } from "../_components/TrashedCustomersModal";
import { useViewingFiscalYear } from "@/features/fiscal-year/ViewingFiscalYearProvider";

type SidebarProduct = {
  ulid: string;
  name: string;
  stock: number;
  wacc: number | null;
  cost_price: number | null;
  stock_balances?: { fiscal_year_id: number; opening_quantity: number; remaining_quantity: number }[];
};

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
  payment_type: string | null;
  items: SavedItem[];
};

let nextKey = 1;

function emptyRow(): LineItem {
  return { key: nextKey++, productUlid: "", particular: "", quantity: "", rate: "", discount: "0", saved: false, itemUlid: null };
}


function GoodsSoldContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const customerParam = searchParams.get("customer");
  const editTransactionParam = searchParams.get("transaction");
  const productParam = searchParams.get("product");
  const queryClient = useQueryClient();
  // Whether this page was entered already knowing the customer (clicked from the customer's own
  // page/sidebar) vs. arriving with no customer chosen (e.g. from Product/Stock) — captured once
  // so picking a customer from the search field below doesn't make that field disappear mid-pick.
  const cameWithCustomerRef = useRef(!!customerParam);
  // Arrived from Product/Stock's "Goods Sold" button — keep the product list in the
  // sidebar (instead of the customer list) for the whole session, so the user can keep picking
  // products to add as line items while choosing the customer up top.
  const cameFromProductRef = useRef(!!productParam);

  const [sideSearch, setSideSearch] = useState("");
  const [selectedCustomerUlid, setSelectedCustomerUlid] = useState<string | null>(customerParam);
  const [rows, setRows] = useState<LineItem[]>([emptyRow()]);
  const [billDate, setBillDate] = useState(getTodayBs);
  const [billNo, setBillNo] = useState("");
  const [transactionUlid, setTransactionUlid] = useState<string | null>(null);
  // Which fiscal year this bill is recorded against — defaults to the tenant's active one
  // once it loads, but the user can pick a different year via the dropdown before saving.
  const [selectedFiscalYearId, setSelectedFiscalYearId] = useState<number | null>(null);
  const [paymentType, setPaymentType] = useState<"cash" | "credit">("credit");
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

  const receiptImage = useImageGroup("acc_customer_transaction", "acc-customer-transactions", "bill");

  const CUSTOMER_INITIAL_FORM: CustomerFormState = { name: "", address: "", phone: "", telephone: "", vat_no: "", fiscal_year_id: "", opening_balance: "" };
  const [customerPanelOpen, setCustomerPanelOpen] = useState(false);
  const [customerForm, setCustomerForm] = useState<CustomerFormState>(CUSTOMER_INITIAL_FORM);
  const [customerErrors, setCustomerErrors] = useState<CustomerFormErrors>({});
  const [trashedCustomersOpen, setTrashedCustomersOpen] = useState(false);

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

  const { data: sidebarProductsData, isLoading: sidebarProductsLoading } = useQuery({
    queryKey: ["products-sidebar"],
    queryFn: () => apiFetch<{ data: SidebarProduct[]; meta: Meta }>("/products?per_page=200&sort_by=name&sort_dir=asc"),
    enabled: cameFromProductRef.current,
  });
  const sidebarProducts = sidebarProductsData?.data ?? [];

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

  const customers = customersData?.data ?? [];
  const selectedCustomer = customers.find((c) => c.ulid === selectedCustomerUlid) ?? null;

  const { data: transactionsData } = useQuery({
    queryKey: ["acc-customer-transactions", selectedCustomer?.ulid],
    queryFn: () => apiFetch<{ data: SavedTransaction[] }>(`/acc-customers/${selectedCustomer!.ulid}/transactions`),
    enabled: !!selectedCustomer && !!editTransactionParam,
  });

  // Pre-fill the first row with the product we arrived from, once it's loaded.
  const prefilledProductRef = useRef(false);
  useEffect(() => {
    if (!productParam || prefilledProductRef.current || sidebarProducts.length === 0) return;
    const product = sidebarProducts.find((p) => p.ulid === productParam);
    if (!product) return;
    prefilledProductRef.current = true;
    selectSidebarProduct(product);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- selectSidebarProduct is stable enough for this one-time prefill
  }, [productParam, sidebarProducts]);

  useEffect(() => {
    if (!selectedCustomerUlid && customers.length > 0 && cameWithCustomerRef.current) setSelectedCustomerUlid(customers[0].ulid);
  }, [customers]);

  // Reacting to the customer selection changing. Two distinct cases:
  //  - First pick (prev === null): the user may have already filled in items before choosing a
  //    customer (trySaveRow couldn't save them yet without one) — save whatever's complete now,
  //    and leave the draft otherwise untouched.
  //  - Swapping to a *different* already-selected customer: that other customer's draft doesn't
  //    carry over, so start a fresh bill instead.
  const prevCustomerUlidRef = useRef<string | null>(null);
  useEffect(() => {
    const prev = prevCustomerUlidRef.current;
    prevCustomerUlidRef.current = selectedCustomerUlid;
    if (editTransactionParam || prev === selectedCustomerUlid) return;

    if (!prev) {
      rows.forEach((row) => {
        if (!row.saved && row.productUlid && row.quantity && Number(row.quantity) > 0 && row.rate !== "") {
          trySaveRow(row.key);
        }
      });
      return;
    }

    setRows([emptyRow()]);
    transactionUlidRef.current = null;
    setTransactionUlid(null);
    setBillDate(getTodayBs());
    setBillNo("");
    setDiscountPercent("0");
    setDiscountAmountDraft(null);
    setBillTotals(null);
    setSelectedFiscalYearId(activeFiscalYearId);
    setPaymentType("credit");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to the customer selection changing
  }, [selectedCustomerUlid]);

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
    setPaymentType(tx.payment_type === "cash" ? "cash" : "credit");
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

  function selectCustomer(ulid: string) {
    setSelectedCustomerUlid(ulid);
    router.replace(`/admin/customers/goods-sold?customer=${ulid}${productParam ? `&product=${productParam}` : ""}`);
  }

  // Picking a product from the (Product/Stock-origin) sidebar fills it into the first row
  // that doesn't have a product yet, or adds a new row for it.
  function selectSidebarProduct(product: SidebarProduct) {
    const rate = product.wacc ?? product.cost_price ?? null;
    setRows((prev) => {
      const openIdx = prev.findIndex((r) => !r.saved && !r.productUlid);
      if (openIdx === -1) {
        return [...prev, { ...emptyRow(), productUlid: product.ulid, particular: product.name, rate: rate != null ? String(rate) : "" }];
      }
      return prev.map((r, i) => (i === openIdx
        ? { ...r, productUlid: product.ulid, particular: product.name, rate: rate != null ? String(rate) : r.rate }
        : r));
    });
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
      if (!selectedCustomerUlid || !transactionUlid) return;
      if (!confirm("Delete this line item?")) return;
      deleteItemMutation.mutate(
        { customerUlid: selectedCustomerUlid, txUlid: transactionUlid, itemUlid: row.itemUlid },
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

  // Every mutation that changes a transaction/item invalidates the customer's transactions
  // cache — the global QueryClient uses a 30s staleTime, so without this a re-visit to this
  // page (or the ledger) within that window would silently show pre-edit data. A bill item
  // also mirrors into that product's own stock ledger (product_transaction_items), so that
  // cache needs invalidating too — otherwise the Product page only catches up on a hard
  // reload. Shared with admin/customers/page.tsx, which has its own copy of this same
  // mutation flow — see useAccountingInvalidation.ts for why this is centralized.
  const invalidateCustomerTransactions = useInvalidateCustomerTransactions();

  const createTransactionMutation = useMutation({
    mutationFn: ({ customerUlid, payload }: { customerUlid: string; payload: object }) =>
      apiFetch<{ data: { ulid: string } & TotalsPayload }>(
        `/acc-customers/${customerUlid}/transactions`, { method: "POST", body: JSON.stringify(payload) }
      ),
    onSuccess: (_data, variables) => invalidateCustomerTransactions(variables.customerUlid),
  });

  const addItemMutation = useMutation({
    mutationFn: ({ customerUlid, txUlid, payload }: { customerUlid: string; txUlid: string; payload: object }) =>
      apiFetch<{ data: { ulid: string; transaction: TotalsPayload } }>(
        `/acc-customers/${customerUlid}/transactions/${txUlid}/items`, { method: "POST", body: JSON.stringify(payload) }
      ),
    onSuccess: (_data, variables) => invalidateCustomerTransactions(variables.customerUlid),
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ customerUlid, txUlid, itemUlid, payload }: { customerUlid: string; txUlid: string; itemUlid: string; payload: object }) =>
      apiFetch<{ data: { ulid: string; transaction: TotalsPayload } }>(
        `/acc-customers/${customerUlid}/transactions/${txUlid}/items/${itemUlid}`, { method: "PATCH", body: JSON.stringify(payload) }
      ),
    onSuccess: (_data, variables) => invalidateCustomerTransactions(variables.customerUlid),
  });

  const updateTotalsMutation = useMutation({
    mutationFn: ({ customerUlid, txUlid, body }: { customerUlid: string; txUlid: string; body: { discount_percent?: number; discount_amount?: number } }) =>
      apiFetch<{ data: TotalsPayload }>(
        `/acc-customers/${customerUlid}/transactions/${txUlid}/totals`, { method: "PATCH", body: JSON.stringify(body) }
      ),
    onSuccess: (_data, variables) => invalidateCustomerTransactions(variables.customerUlid),
  });

  const updateHeaderMutation = useMutation({
    mutationFn: ({ customerUlid, txUlid, payload }: { customerUlid: string; txUlid: string; payload: object }) =>
      apiFetch(`/acc-customers/${customerUlid}/transactions/${txUlid}`, { method: "PATCH", body: JSON.stringify(payload) }),
    onSuccess: (_data, variables) => invalidateCustomerTransactions(variables.customerUlid),
    onError: (err: any) => toast.error("Failed to update bill details", err?.message ?? "Something went wrong."),
  });

  const deleteItemMutation = useMutation({
    mutationFn: ({ customerUlid, txUlid, itemUlid }: { customerUlid: string; txUlid: string; itemUlid: string }) =>
      apiFetch(`/acc-customers/${customerUlid}/transactions/${txUlid}/items/${itemUlid}`, { method: "DELETE" }),
    onSuccess: (_data, variables) => {
      invalidateCustomerTransactions(variables.customerUlid);
      toast.success("Item removed", "The line item has been deleted.");
    },
    onError: (err: any) => toast.error("Failed to delete item", err?.message ?? "Something went wrong."),
  });

  const [trashedItemsOpen, setTrashedItemsOpen] = useState(false);
  const { data: trashedItemsData, isLoading: trashedItemsLoading } = useQuery({
    queryKey: ["acc-customer-transaction-items-trashed", transactionUlid],
    queryFn: () => apiFetch<{ data: { ulid: string; product_name: string; quantity: number; rate: number; discount: number; total: number }[] }>(
      `/acc-customers/${selectedCustomerUlid}/transactions/${transactionUlid}/items/trashed`
    ),
    enabled: !!selectedCustomerUlid && !!transactionUlid && trashedItemsOpen,
  });

  const restoreItemMutation = useMutation({
    mutationFn: (itemUlid: string) =>
      apiFetch(`/acc-customers/${selectedCustomerUlid}/transactions/${transactionUlid}/items/${itemUlid}/restore`, { method: "POST" }),
    onSuccess: () => {
      if (selectedCustomerUlid) invalidateCustomerTransactions(selectedCustomerUlid);
      queryClient.invalidateQueries({ queryKey: ["acc-customer-transaction-items-trashed", transactionUlid] });
      toast.success("Item restored", "The line item is back on this bill.");
    },
    onError: (err: any) => toast.error("Failed to restore item", err?.message ?? "Something went wrong."),
  });

  function saveHeader(overrides?: { paymentType?: "cash" | "credit" }) {
    if (!selectedCustomerUlid || !transactionUlid || !isValidBsDate(billDate)) return;
    updateHeaderMutation.mutate({
      customerUlid: selectedCustomerUlid,
      txUlid: transactionUlid,
      payload: {
        date: billDate,
        particular: "sales",
        voucher_no: billNo || null,
        payment_type: overrides?.paymentType ?? paymentType,
      },
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
    if (!selectedCustomerUlid || !transactionUlid) return;
    const pct = Math.max(0, Math.min(100, Number(discountPercent) || 0));
    try {
      const res = await updateTotalsMutation.mutateAsync({ customerUlid: selectedCustomerUlid, txUlid: transactionUlid, body: { discount_percent: pct } });
      applyTotalsResult(res.data);
      setDiscountAmountDraft(null);
      queryClient.invalidateQueries({ queryKey: ["acc-customers"] });
    } catch (err: any) {
      toast.error("Failed to update discount", err?.message ?? "Something went wrong.");
    }
  }

  async function saveDiscountAmount() {
    if (!selectedCustomerUlid || !transactionUlid) return;
    const amount = Math.max(0, Number(discountAmountDraft) || 0);
    try {
      const res = await updateTotalsMutation.mutateAsync({ customerUlid: selectedCustomerUlid, txUlid: transactionUlid, body: { discount_amount: Math.round(amount) } });
      applyTotalsResult(res.data);
      setDiscountAmountDraft(null);
      queryClient.invalidateQueries({ queryKey: ["acc-customers"] });
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
    if (!selectedCustomerUlid || !isValidBsDate(billDate)) return;
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
      const isUpdate = !!(row.itemUlid && transactionUlid);

      if (isUpdate && transactionUlid && row.itemUlid) {
        // Re-editing an already-saved row (double-clicked back into edit mode) — update the
        // existing line item instead of creating a duplicate.
        const res = await updateItemMutation.mutateAsync({ customerUlid: selectedCustomerUlid, txUlid: transactionUlid, itemUlid: row.itemUlid, payload: itemPayload });
        applyTotalsResult(res.data.transaction);
      } else if (!transactionUlid) {
        const res = await createTransactionMutation.mutateAsync({
          customerUlid: selectedCustomerUlid,
          payload: {
            date: billDate,
            particular: "sales",
            voucher_no: billNo || null,
            discount_percent: Math.max(0, Math.min(100, Number(discountPercent) || 0)),
            items: [itemPayload],
            fiscal_year_id: selectedFiscalYearId ?? undefined,
            payment_type: paymentType,
          },
        });
        transactionUlidRef.current = res.data.ulid;
        setTransactionUlid(res.data.ulid);
        applyTotalsResult(res.data);
      } else {
        const res = await addItemMutation.mutateAsync({ customerUlid: selectedCustomerUlid, txUlid: transactionUlid, payload: itemPayload });
        itemUlid = res.data.ulid;
        applyTotalsResult(res.data.transaction);
      }

      setRows((prev) => {
        const next = prev.map((r) => (r.key === key ? { ...r, saved: true, itemUlid } : r));
        const isLast = prev[prev.length - 1]?.key === key;
        return isLast ? [...next, emptyRow()] : next;
      });
      toast.success(isUpdate ? "Item updated" : "Item recorded", `${row.particular} has been ${isUpdate ? "updated" : "added to this sale"}.`);
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

  const inputCls = "w-full h-full px-3 text-sm text-black bg-white border-0 focus:outline-none focus:ring-1 focus:ring-inset focus:ring-slate-400 placeholder:text-text-muted";

  function exitDestination() {
    if (cameFromProductRef.current) return `/admin/products?product=${productParam}`;
    return selectedCustomer ? `/admin/customers?customer=${selectedCustomer.ulid}` : "/admin/customers";
  }

  return (
    <div className="flex gap-0 transition-all duration-300 h-full">
      <div className="flex-1 min-w-0 flex flex-col p-6 gap-6 h-full">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-h3 font-bold text-text-default">{editTransactionParam ? "Edit Goods Sold" : "Goods Sold"}</h2>
            <p className="text-sm text-text-muted mt-0.5">{editTransactionParam ? "Update items sold to a customer." : "Record items sold to a customer."}</p>
          </div>
          <div className="flex items-center shrink-0">
            {transactionUlid && (
              <button
                onClick={() => setTrashedItemsOpen(true)}
                className="flex items-center gap-2 border border-slate-300 px-4 py-2 text-sm font-semibold text-text-default hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <Trash2 className="h-4 w-4" />
                Recently Deleted
              </button>
            )}
            <Link
              href={exitDestination()}
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
          {cameFromProductRef.current ? (
            <StockSidebar
              products={sidebarProducts}
              loading={sidebarProductsLoading}
              activeFiscalYearId={activeFiscalYearId}
              selectedProductUlid={undefined}
              search={sideSearch}
              onSearchChange={setSideSearch}
              onSelect={selectSidebarProduct}
              onDelete={() => {}}
            />
          ) : (
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
          )}

          {/* Right side: detail card + line item table */}
          <div className="flex-1 min-w-0 flex flex-col gap-4 h-full min-h-0">
            {/* Account detail card */}
            <div className="bg-white px-5 py-4 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <CustomerInfoBlock
                  customer={selectedCustomer}
                  customers={cameWithCustomerRef.current ? undefined : customers}
                  onSelectCustomer={cameWithCustomerRef.current ? undefined : selectCustomer}
                />

                <div className="flex flex-col gap-2 shrink-0 w-48">
                  <input
                    type="text"
                    value={billNo}
                    onChange={(e) => setBillNo(e.target.value)}
                    onBlur={() => saveHeader()}
                    placeholder="Bill no..."
                    className="w-full h-8 px-2 text-sm font-medium text-black border border-slate-300 focus:outline-none focus:border-slate-500 bg-white disabled:bg-slate-100 disabled:text-text-muted"
                  />
                  <BsDateInput value={billDate} onChange={setBillDate} onBlur={() => saveHeader()} />
                  <div className="flex items-center gap-4 h-8">
                    <label className="flex items-center gap-1.5 text-sm font-medium text-black cursor-pointer">
                      <input
                        type="radio"
                        name="payment-type"
                        checked={paymentType === "cash"}
                        onChange={() => { setPaymentType("cash"); if (transactionUlid) saveHeader({ paymentType: "cash" }); }}
                        className="accent-black"
                      />
                      Cash
                    </label>
                    <label className="flex items-center gap-1.5 text-sm font-medium text-black cursor-pointer">
                      <input
                        type="radio"
                        name="payment-type"
                        checked={paymentType === "credit"}
                        onChange={() => { setPaymentType("credit"); if (transactionUlid) saveHeader({ paymentType: "credit" }); }}
                        className="accent-black"
                      />
                      Credit
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Line item table + footer group — no gap between them; only the table scrolls */}
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

            </div>

            {/* Fixed footer — stays put while the line item table above scrolls */}
            <div className="flex items-center justify-end px-4 py-3 mt-3 bg-white shrink-0">
              <button
                onClick={() => router.push(exitDestination())}
                className="px-6 py-2 text-sm font-semibold text-text-default border border-slate-300 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  toast.success("Sale recorded", "The bill has been saved.");
                  router.push(exitDestination());
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

      <TrashedItemsModal
        open={trashedItemsOpen}
        onClose={() => setTrashedItemsOpen(false)}
        loading={trashedItemsLoading}
        items={trashedItemsData?.data ?? []}
        restoring={restoreItemMutation.isPending}
        onRestore={(itemUlid) => restoreItemMutation.mutate(itemUlid)}
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

export default function GoodsSoldPage() {
  return (
    <Suspense fallback={null}>
      <GoodsSoldContent />
    </Suspense>
  );
}
