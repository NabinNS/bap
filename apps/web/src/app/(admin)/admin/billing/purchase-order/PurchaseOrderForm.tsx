"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2, Plus, Sparkles, Search } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { toast } from "@/lib/toast";
import { getTodayBs, isValidBsDate } from "@/components/ui/form/BsDateInput";
import { ProductCombobox, ProductOption } from "@/components/products/ProductCombobox";
import { VendorPricePanel, VendorPrice } from "@/components/products/VendorPricePanel";
import { CreateProductPanel } from "@/components/products/CreateProductPanel";
import { ConfirmDialog } from "@/components/ui/dialog/ConfirmDialog";
import { Vendor } from "../../accounts/_components/types";

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
  saved: boolean;
  itemUlid: string | null;
};

type SavedItem = {
  ulid: string;
  product_ulid: string;
  product_name: string;
  quantity: number | null;
  rate: number | null;
};

type SavedPurchaseOrder = {
  ulid: string;
  fiscal_year_id: number | null;
  date: string;
  voucher_no: string | null;
  items: SavedItem[];
};

let nextKey = 1;

function emptyRow(): LineItem {
  return { key: nextKey++, productUlid: "", particular: "", quantity: "", rate: "", saved: false, itemUlid: null };
}

type PurchaseOrderFormProps = {
  /** Pre-selects a vendor, e.g. when opened from that vendor's own page. */
  initialVendorUlid?: string | null;
  /** Loads an existing purchase order for editing. */
  initialPurchaseOrderUlid?: string | null;
  /** Called when the user is done (Cancel/Save/Back) — the host decides what to show next. */
  onExit: () => void;
  /** When provided, the vendor-price and add-product side panels portal here instead of rendering inline, so the host can position them spanning the full page height. */
  sidePanelsContainer?: HTMLElement | null;
};

export function PurchaseOrderForm({ initialVendorUlid = null, initialPurchaseOrderUlid = null, onExit, sidePanelsContainer = null }: PurchaseOrderFormProps) {
  const queryClient = useQueryClient();

  const [selectedVendorUlid, setSelectedVendorUlid] = useState<string | null>(initialVendorUlid);
  const [rows, setRows] = useState<LineItem[]>([emptyRow()]);
  const [orderDate, setOrderDate] = useState(getTodayBs);
  const [orderNo, setOrderNo] = useState("");
  const [purchaseOrderUlid, setPurchaseOrderUlid] = useState<string | null>(null);
  const purchaseOrderUlidRef = useRef<string | null>(null);
  const [createProductRowKey, setCreateProductRowKey] = useState<number | null>(null);
  const [createProductQuery, setCreateProductQuery] = useState("");
  const savingKeysRef = useRef<Set<number>>(new Set());
  const lastSavedRef = useRef<Map<number, string>>(new Map());
  const quantityInputRefs = useRef<Map<number, HTMLInputElement>>(new Map());
  const loadedPurchaseOrderRef = useRef<string | null>(null);
  const [activeProduct, setActiveProduct] = useState<ProductOption | null>(null);
  const activeRowKeyRef = useRef<number | null>(null);
  const [pendingMove, setPendingMove] = useState<{ row: LineItem; target: VendorPrice } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{ type: "row"; key: number } | { type: "bulk" } | null>(null);
  const [itemSearch, setItemSearch] = useState("");
  const [selectedKeys, setSelectedKeys] = useState<Set<number>>(new Set());

  const { data: vendorsData } = useQuery({
    queryKey: ["acc-vendors"],
    queryFn: () => apiFetch<{ data: Vendor[]; meta: Meta }>("/acc-vendors?per_page=100"),
  });

  const vendors = vendorsData?.data ?? [];
  const selectedVendor = vendors.find((v) => v.ulid === selectedVendorUlid) ?? null;

  const { data: lowStockData } = useQuery({
    queryKey: ["acc-vendors", selectedVendor?.ulid, "low-stock-suggestions"],
    queryFn: () => apiFetch<{ data: ProductOption[] }>(`/acc-vendors/${selectedVendor!.ulid}/low-stock-suggestions`),
    enabled: !!selectedVendor,
  });
  const lowStockSuggestions = lowStockData?.data ?? [];

  function addLowStockSuggestions() {
    const existingProductUlids = new Set(rows.map((r) => r.productUlid).filter(Boolean));
    const newRows = lowStockSuggestions
      .filter((p) => !existingProductUlids.has(p.ulid))
      .map((p) => ({ key: nextKey++, productUlid: p.ulid, particular: p.name, quantity: "", rate: "", saved: false, itemUlid: null }));
    if (newRows.length === 0) return;
    setRows((prev) => {
      const withoutTrailingEmpty = prev.filter((r) => r.productUlid || r.saved);
      return [...withoutTrailingEmpty, ...newRows, emptyRow()];
    });
  }

  const { data: purchaseOrdersData } = useQuery({
    queryKey: ["acc-purchase-orders", selectedVendor?.ulid],
    queryFn: () => apiFetch<{ data: SavedPurchaseOrder[] }>(`/acc-vendors/${selectedVendor!.ulid}/purchase-orders`),
    enabled: !!selectedVendor,
  });

  // When no specific purchase order was requested, continue the vendor's most recent one
  // instead of silently starting a new, separate order every time this form opens.
  const latestPurchaseOrderUlid = purchaseOrdersData?.data.length
    ? purchaseOrdersData.data[purchaseOrdersData.data.length - 1].ulid
    : null;
  const targetPurchaseOrderUlid = initialPurchaseOrderUlid ?? latestPurchaseOrderUlid;

  // Reacting to the vendor selection changing. Two distinct cases:
  //  - First pick (prev === null): the user may have already filled in items before choosing a
  //    vendor (trySaveRow couldn't save them yet without one) — save whatever's complete now,
  //    and leave the draft otherwise untouched.
  //  - Swapping to a *different* already-selected vendor: that other vendor's draft doesn't
  //    carry over, so start a fresh purchase order instead.
  const prevVendorUlidRef = useRef<string | null>(initialVendorUlid);
  useEffect(() => {
    const prev = prevVendorUlidRef.current;
    prevVendorUlidRef.current = selectedVendorUlid;
    if (initialPurchaseOrderUlid || prev === selectedVendorUlid) return;

    loadedPurchaseOrderRef.current = null;

    if (!prev) {
      rows.forEach((row) => {
        if (!row.saved && row.productUlid && row.quantity && Number(row.quantity) > 0) {
          trySaveRow(row.key);
        }
      });
      return;
    }

    setRows([emptyRow()]);
    purchaseOrderUlidRef.current = null;
    setPurchaseOrderUlid(null);
    setOrderDate(getTodayBs());
    setOrderNo("");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to the vendor selection changing
  }, [selectedVendorUlid]);

  // Load the existing purchase order into the form once — either the one explicitly requested,
  // or (when none was) the vendor's most recent one, so previously saved items are visible
  // instead of silently starting a new order every time.
  useEffect(() => {
    if (!targetPurchaseOrderUlid || loadedPurchaseOrderRef.current === targetPurchaseOrderUlid) return;
    const po = purchaseOrdersData?.data.find((item) => item.ulid === targetPurchaseOrderUlid);
    if (!po) return;
    loadedPurchaseOrderRef.current = targetPurchaseOrderUlid;
    purchaseOrderUlidRef.current = po.ulid;
    setPurchaseOrderUlid(po.ulid);
    setOrderDate(po.date);
    setOrderNo(po.voucher_no ?? "");
    const savedRows: LineItem[] = po.items.map((it) => ({
      key: nextKey++,
      productUlid: it.product_ulid,
      particular: it.product_name,
      quantity: it.quantity != null ? String(it.quantity) : "",
      rate: it.rate != null ? String(it.rate) : "",
      saved: true,
      itemUlid: it.ulid,
    }));
    setRows([...savedRows, emptyRow()]);
  }, [targetPurchaseOrderUlid, purchaseOrdersData]);

  function updateRow(key: number, field: keyof Omit<LineItem, "key" | "saved" | "itemUlid">, value: string) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, [field]: value } : r)));
  }

  function selectProduct(key: number, ulid: string, product: ProductOption | null) {
    setRows((prev) => {
      const next = prev.map((r) => (r.key === key ? { ...r, productUlid: ulid, particular: product?.name ?? "" } : r));
      const isLast = prev[prev.length - 1]?.key === key;
      return isLast && ulid ? [...next, emptyRow()] : next;
    });
    setActiveProduct(product);
  }

  // Minimal stand-in for an already-picked product's option — VendorPricePanel only needs
  // the ulid (and uses the name only as a fallback label), so the rest can be left blank.
  function productOptionFor(row: LineItem): ProductOption | null {
    if (!row.productUlid) return null;
    return {
      ulid: row.productUlid,
      name: row.particular,
      sku: null,
      cost_price: null,
      wacc: null,
      sales_price: null,
      stock: null,
      low_stock_quantity: null,
      is_low_stock: false,
    };
  }

  function addRow() {
    setRows((prev) => [...prev, emptyRow()]);
  }

  function invalidatePurchaseOrders(vendorUlid: string) {
    queryClient.invalidateQueries({ queryKey: ["acc-purchase-orders", vendorUlid] });
    queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
    queryClient.invalidateQueries({ queryKey: ["acc-vendors"] });
  }

  function removeRow(key: number) {
    const row = rows.find((r) => r.key === key);
    if (!row) return;
    if (row.saved && row.itemUlid) {
      if (!selectedVendorUlid || !purchaseOrderUlid) return;
      setPendingDelete({ type: "row", key });
      return;
    }
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.key !== key) : prev));
  }

  function confirmRemoveRow() {
    if (!pendingDelete || pendingDelete.type !== "row" || !selectedVendorUlid || !purchaseOrderUlid) return;
    const key = pendingDelete.key;
    const row = rows.find((r) => r.key === key);
    if (!row?.itemUlid) { setPendingDelete(null); return; }
    deleteItemMutation.mutate(
      { vendorUlid: selectedVendorUlid, purchaseOrderUlid, itemUlid: row.itemUlid },
      { onSuccess: () => setRows((prev) => prev.filter((r) => r.key !== key)) }
    );
    setPendingDelete(null);
  }

  function requestMoveToVendor(key: number, target: VendorPrice) {
    const row = rows.find((r) => r.key === key);
    if (!row || !row.productUlid || target.vendor_ulid === selectedVendorUlid) return;
    setPendingMove({ row, target });
  }

  async function confirmMove() {
    if (!pendingMove) return;
    const { row, target } = pendingMove;
    const key = row.key;

    try {
      // Add it to that vendor's most recent purchase order, or start a new one if they have none.
      const targetOrders = await apiFetch<{ data: SavedPurchaseOrder[] }>(`/acc-vendors/${target.vendor_ulid}/purchase-orders`);
      const targetPoUlid = targetOrders.data.length ? targetOrders.data[targetOrders.data.length - 1].ulid : null;
      const itemPayload = { product_ulid: row.productUlid, quantity: row.quantity ? Number(row.quantity) : null, rate: target.rate };

      if (targetPoUlid) {
        await apiFetch(`/acc-vendors/${target.vendor_ulid}/purchase-orders/${targetPoUlid}/items`, {
          method: "POST",
          body: JSON.stringify(itemPayload),
        });
      } else {
        await apiFetch(`/acc-vendors/${target.vendor_ulid}/purchase-orders`, {
          method: "POST",
          body: JSON.stringify({ date: getTodayBs(), voucher_no: null, items: [itemPayload] }),
        });
      }

      if (row.saved && row.itemUlid && selectedVendorUlid && purchaseOrderUlid) {
        await deleteItemMutation.mutateAsync({ vendorUlid: selectedVendorUlid, purchaseOrderUlid, itemUlid: row.itemUlid });
      }

      lastSavedRef.current.delete(key);
      setRows((prev) => {
        const next = prev.filter((r) => r.key !== key);
        return next.length > 0 ? next : [emptyRow()];
      });
      queryClient.invalidateQueries({ queryKey: ["acc-purchase-orders", target.vendor_ulid] });
      queryClient.invalidateQueries({ queryKey: ["acc-vendors"] });
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      setActiveProduct(null);
      activeRowKeyRef.current = null;
      setPendingMove(null);
      toast.success("Item moved", `Moved to ${target.vendor_name}.`);
    } catch (err: any) {
      toast.error("Failed to move item", err?.message ?? "Something went wrong.");
    }
  }

  function toggleSelected(key: number) {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function requestDeleteSelected() {
    if (selectedKeys.size === 0) return;
    setPendingDelete({ type: "bulk" });
  }

  async function confirmDeleteSelected() {
    const savedToDelete = rows.filter((r) => selectedKeys.has(r.key) && r.saved && r.itemUlid);
    if (savedToDelete.length > 0 && selectedVendorUlid && purchaseOrderUlid) {
      await Promise.all(
        savedToDelete.map((row) =>
          deleteItemMutation.mutateAsync({ vendorUlid: selectedVendorUlid, purchaseOrderUlid, itemUlid: row.itemUlid! })
        )
      );
    }
    setRows((prev) => {
      const next = prev.filter((r) => !selectedKeys.has(r.key));
      return next.length > 0 ? next : [emptyRow()];
    });
    setSelectedKeys(new Set());
    setPendingDelete(null);
  }

  const visibleRows = itemSearch.trim()
    ? rows.filter((r) => !r.saved || r.particular.toLowerCase().includes(itemSearch.trim().toLowerCase()))
    : rows;

  const selectableKeys = visibleRows.filter((r) => r.productUlid).map((r) => r.key);

  function toggleSelectAll() {
    setSelectedKeys((prev) => {
      const allSelected = selectableKeys.length > 0 && selectableKeys.every((key) => prev.has(key));
      return allSelected ? new Set() : new Set(selectableKeys);
    });
  }

  const totalQuantity = rows.reduce((sum, r) => sum + (parseFloat(r.quantity) || 0), 0);

  const rowProductUlids = Array.from(new Set(rows.map((r) => r.productUlid).filter(Boolean))).sort();
  const { data: productRatesData } = useQuery({
    queryKey: ["acc-vendors", selectedVendor?.ulid, "product-rates", rowProductUlids.join(",")],
    queryFn: () => apiFetch<{ data: { product_ulid: string; rate: number }[] }>(
      `/acc-vendors/${selectedVendor!.ulid}/product-rates?${rowProductUlids.map((u) => `product_ulids[]=${u}`).join("&")}`
    ),
    enabled: !!selectedVendor && rowProductUlids.length > 0,
  });
  const ratesByProduct = new Map((productRatesData?.data ?? []).map((r) => [r.product_ulid, r.rate]));

  function effectiveRate(row: LineItem): number | null {
    if (row.rate) return parseFloat(row.rate);
    return row.productUlid && ratesByProduct.has(row.productUlid) ? ratesByProduct.get(row.productUlid)! : null;
  }

  // Prefill a row's rate with the vendor's last price once it resolves, unless the user has
  // already typed their own rate — they can always overwrite it afterward.
  useEffect(() => {
    setRows((prev) => {
      let changed = false;
      const next = prev.map((r) => {
        if (!r.rate && r.productUlid && ratesByProduct.has(r.productUlid)) {
          changed = true;
          return { ...r, rate: String(ratesByProduct.get(r.productUlid)) };
        }
        return r;
      });
      return changed ? next : prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to new rate data resolving
  }, [productRatesData]);

  const rowsWithKnownRate = rows.filter((r) => effectiveRate(r) !== null);
  const estimatedTotal = rowsWithKnownRate.reduce((sum, r) => sum + (parseFloat(r.quantity) || 0) * (effectiveRate(r) ?? 0), 0);
  const hasUnpricedRows = rows.some((r) => r.productUlid && r.quantity && effectiveRate(r) === null);

  const createPurchaseOrderMutation = useMutation({
    mutationFn: ({ vendorUlid, payload }: { vendorUlid: string; payload: object }) =>
      apiFetch<{ data: { ulid: string } }>(
        `/acc-vendors/${vendorUlid}/purchase-orders`, { method: "POST", body: JSON.stringify(payload) }
      ),
    onSuccess: (_data, variables) => invalidatePurchaseOrders(variables.vendorUlid),
  });

  const addItemMutation = useMutation({
    mutationFn: ({ vendorUlid, purchaseOrderUlid, payload }: { vendorUlid: string; purchaseOrderUlid: string; payload: object }) =>
      apiFetch<{ data: { ulid: string } }>(
        `/acc-vendors/${vendorUlid}/purchase-orders/${purchaseOrderUlid}/items`, { method: "POST", body: JSON.stringify(payload) }
      ),
    onSuccess: (_data, variables) => invalidatePurchaseOrders(variables.vendorUlid),
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ vendorUlid, purchaseOrderUlid, itemUlid, payload }: { vendorUlid: string; purchaseOrderUlid: string; itemUlid: string; payload: object }) =>
      apiFetch<{ data: { ulid: string } }>(
        `/acc-vendors/${vendorUlid}/purchase-orders/${purchaseOrderUlid}/items/${itemUlid}`, { method: "PATCH", body: JSON.stringify(payload) }
      ),
    onSuccess: (_data, variables) => invalidatePurchaseOrders(variables.vendorUlid),
  });

  const updateHeaderMutation = useMutation({
    mutationFn: ({ vendorUlid, purchaseOrderUlid, payload }: { vendorUlid: string; purchaseOrderUlid: string; payload: object }) =>
      apiFetch(`/acc-vendors/${vendorUlid}/purchase-orders/${purchaseOrderUlid}`, { method: "PATCH", body: JSON.stringify(payload) }),
    onSuccess: (_data, variables) => invalidatePurchaseOrders(variables.vendorUlid),
    onError: (err: any) => toast.error("Failed to update purchase order details", err?.message ?? "Something went wrong."),
  });

  const deleteItemMutation = useMutation({
    mutationFn: ({ vendorUlid, purchaseOrderUlid, itemUlid }: { vendorUlid: string; purchaseOrderUlid: string; itemUlid: string }) =>
      apiFetch(`/acc-vendors/${vendorUlid}/purchase-orders/${purchaseOrderUlid}/items/${itemUlid}`, { method: "DELETE" }),
    onSuccess: (_data, variables) => {
      invalidatePurchaseOrders(variables.vendorUlid);
      toast.success("Item removed", "The line item has been deleted.");
    },
    onError: (err: any) => toast.error("Failed to delete item", err?.message ?? "Something went wrong."),
  });

  function saveHeader() {
    if (!selectedVendorUlid || !purchaseOrderUlid || !isValidBsDate(orderDate)) return;
    updateHeaderMutation.mutate({
      vendorUlid: selectedVendorUlid,
      purchaseOrderUlid,
      payload: { date: orderDate, voucher_no: orderNo || null },
    });
  }

  async function trySaveRow(key: number, overrides?: Partial<LineItem>) {
    if (!selectedVendorUlid || !isValidBsDate(orderDate)) return;
    if (savingKeysRef.current.has(key)) return;

    const found = rows.find((r) => r.key === key);
    if (!found) return;
    const row = overrides ? { ...found, ...overrides } : found;
    // Quantity and rate are optional — a product on its own is enough to save a draft line item.
    if (!row.productUlid) return;

    // Already-saved rows are always editable now — skip re-saving if nothing actually changed
    // since the last save (e.g. just tabbing through without editing).
    const snapshot = `${row.productUlid}|${row.quantity}|${row.rate}`;
    if (row.saved && lastSavedRef.current.get(key) === snapshot) return;

    savingKeysRef.current.add(key);
    try {
      const itemPayload = {
        product_ulid: row.productUlid,
        quantity: row.quantity && Number(row.quantity) >= 1 ? Number(row.quantity) : null,
        rate: row.rate ? Number(row.rate) : null,
      };
      let itemUlid: string | null = row.itemUlid;
      const isUpdate = !!(row.itemUlid && purchaseOrderUlid);

      if (isUpdate && purchaseOrderUlid && row.itemUlid) {
        await updateItemMutation.mutateAsync({ vendorUlid: selectedVendorUlid, purchaseOrderUlid, itemUlid: row.itemUlid, payload: itemPayload });
      } else if (!purchaseOrderUlid) {
        const res = await createPurchaseOrderMutation.mutateAsync({
          vendorUlid: selectedVendorUlid,
          payload: {
            date: orderDate,
            voucher_no: orderNo || null,
            items: [itemPayload],
          },
        });
        purchaseOrderUlidRef.current = res.data.ulid;
        setPurchaseOrderUlid(res.data.ulid);
      } else {
        const res = await addItemMutation.mutateAsync({ vendorUlid: selectedVendorUlid, purchaseOrderUlid, payload: itemPayload });
        itemUlid = res.data.ulid;
      }

      lastSavedRef.current.set(key, `${row.productUlid}|${row.quantity}|${row.rate}`);
      setRows((prev) => {
        const next = prev.map((r) => (r.key === key ? { ...r, saved: true, itemUlid } : r));
        const isLast = prev[prev.length - 1]?.key === key;
        return isLast ? [...next, emptyRow()] : next;
      });
    } catch (err: any) {
      toast.error("Failed to save item", err?.message ?? "Something went wrong.");
    } finally {
      savingKeysRef.current.delete(key);
    }
  }

  const inputCls = "w-full h-full px-3 text-sm text-black bg-white border-0 focus:outline-none focus:ring-1 focus:ring-inset focus:ring-slate-400 placeholder:text-text-muted";

  const sidePanels = (
    <>
      <CreateProductPanel
        open={createProductRowKey !== null}
        onClose={() => setCreateProductRowKey(null)}
        initialName={createProductQuery}
        onCreated={(product) => {
          if (createProductRowKey !== null) {
            selectProduct(createProductRowKey, product.ulid, product);
            trySaveRow(createProductRowKey, { productUlid: product.ulid });
          }
          setCreateProductRowKey(null);
        }}
      />
    </>
  );

  return (
    <>
    <div className="flex h-full min-h-0 w-full">
      <div className="flex-1 min-w-0 flex flex-col gap-4 h-full min-h-0">
        {/* Line item table + footer group */}
        <div className="flex-1 min-h-0 flex flex-col gap-2">
          {/* Search */}
          <div className="flex items-stretch shrink-0">
            <div className="relative w-full h-10">
              <Search className="absolute left-3 inset-y-0 my-auto h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={itemSearch}
                onChange={(e) => setItemSearch(e.target.value)}
                placeholder="Search items..."
                className="w-full h-10 pl-9 text-sm border border-slate-400 focus:outline-none focus:border-slate-500"
              />
            </div>
            {selectedKeys.size > 0 && (
              <button
                type="button"
                onClick={requestDeleteSelected}
                className="flex h-10 shrink-0 items-center gap-1.5 px-3 border border-l-0 border-slate-400 text-sm font-medium text-red-600 hover:bg-slate-50 hover:text-red-700 cursor-pointer transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                Delete Selected ({selectedKeys.size})
              </button>
            )}
          </div>

          <div className="flex-1 min-h-0 border border-slate-300 bg-white flex flex-col overflow-auto">
            <div className="grid grid-cols-[36px_50px_1fr_120px_120px_50px] min-w-[690px] bg-black">
              <span className="flex items-center justify-center">
                {selectableKeys.length > 0 && (
                  <input
                    type="checkbox"
                    checked={selectableKeys.every((key) => selectedKeys.has(key))}
                    onChange={toggleSelectAll}
                    className="h-3.5 w-3.5 cursor-pointer"
                  />
                )}
              </span>
              <span className="px-3 py-2.5 text-xs font-semibold text-white uppercase tracking-wide">S.N.</span>
              <span className="px-3 py-2.5 text-xs font-semibold text-white uppercase tracking-wide border-l border-white/20">Particulars (Name of Stock)</span>
              <span className="px-3 py-2.5 text-xs font-semibold text-white uppercase tracking-wide border-l border-white/20">Quantity</span>
              <span className="px-3 py-2.5 text-xs font-semibold text-white uppercase tracking-wide border-l border-white/20">Rate</span>
              <span></span>
            </div>

            {visibleRows.map((row, idx) => (
              <div
                key={row.key}
                onFocus={() => {
                  const product = productOptionFor(row);
                  if (product) setActiveProduct((prev) => (prev?.ulid === product.ulid ? prev : product));
                  activeRowKeyRef.current = row.key;
                }}
                onBlur={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                    trySaveRow(row.key);
                    setActiveProduct(null);
                    activeRowKeyRef.current = null;
                  }
                }}
                className="grid grid-cols-[36px_50px_1fr_120px_120px_50px] min-w-[690px] border-b border-[#b0bccc] items-stretch"
              >
                <span className="flex items-center justify-center">
                  {row.productUlid && (
                    <input
                      type="checkbox"
                      checked={selectedKeys.has(row.key)}
                      onChange={() => toggleSelected(row.key)}
                      onClick={(e) => e.stopPropagation()}
                      className="h-3.5 w-3.5 cursor-pointer"
                    />
                  )}
                </span>
                <span className="px-3 py-2 text-sm font-medium text-black flex items-center">{idx + 1}</span>

                <div className="border-l border-[#b0bccc] [&_input]:h-full [&_input]:px-3 [&_input]:text-sm [&_input]:text-black [&_input]:bg-white [&_input]:border-0 [&_input]:rounded-none [&_input]:focus:outline-none [&_input]:focus:ring-1 [&_input]:focus:ring-inset [&_input]:focus:ring-slate-400 [&_.mt-1]:mt-0">
                  <ProductCombobox
                    placeholder="Select a product..."
                    value={row.productUlid}
                    onChange={(val, product) => {
                      selectProduct(row.key, val, product);
                      trySaveRow(row.key, { productUlid: val });
                      // The combobox blurs itself on select — move focus into Quantity so the
                      // user can keep typing instead of losing focus entirely.
                      requestAnimationFrame(() => quantityInputRefs.current.get(row.key)?.focus());
                    }}
                    onAddNew={(query) => { setCreateProductRowKey(row.key); setCreateProductQuery(query); }}
                    // Ignore null highlights — the combobox reports null whenever its own dropdown
                    // closes (e.g. from a document-level outside-click, which fires for a click
                    // anywhere including the price panel itself). Clearing the preview is handled
                    // solely by this row's own blur/close logic instead.
                    onActiveProductChange={(p) => { if (p) setActiveProduct(p); }}
                  />
                </div>
                <div className="border-l border-[#b0bccc]">
                  <input
                    ref={(el) => {
                      if (el) quantityInputRefs.current.set(row.key, el);
                      else quantityInputRefs.current.delete(row.key);
                    }}
                    type="number"
                    min="0"
                    name={`quantity-${row.key}`}
                    autoComplete="off"
                    value={row.quantity}
                    onChange={(e) => updateRow(row.key, "quantity", e.target.value)}
                    placeholder="0"
                    className={inputCls}
                  />
                </div>
                <div className="border-l border-[#b0bccc]">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    name={`rate-${row.key}`}
                    autoComplete="off"
                    value={row.rate}
                    onChange={(e) => updateRow(row.key, "rate", e.target.value)}
                    placeholder={row.productUlid && ratesByProduct.has(row.productUlid) ? String(ratesByProduct.get(row.productUlid)) : "0"}
                    className={inputCls}
                  />
                </div>

                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => removeRow(row.key)}
                  disabled={rows.length === 1 && !row.saved}
                  className="flex items-center justify-center h-full py-2 text-text-muted hover:text-red-600 disabled:opacity-30 disabled:hover:text-text-muted transition-colors cursor-pointer disabled:cursor-not-allowed"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}

            <div className="px-4 py-2.5 flex items-center justify-between min-w-[690px]">
              <div className="flex items-center gap-4">
                <button
                  onClick={addRow}
                  className="flex items-center gap-1.5 text-sm font-semibold text-text-default hover:text-black transition-colors cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Row
                </button>
                {lowStockSuggestions.length > 0 && (
                  <button
                    onClick={addLowStockSuggestions}
                    className="flex items-center gap-1.5 text-sm font-semibold text-amber-700 hover:text-amber-800 transition-colors cursor-pointer"
                    title="Add this vendor's previously-purchased products that are now low on stock"
                  >
                    <Sparkles className="h-3.5 w-3.5" /> Suggest low-stock items ({lowStockSuggestions.length})
                  </button>
                )}
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm-custom text-text-body">
                  Total Quantity: <span className="font-semibold text-text-default">{totalQuantity ? totalQuantity.toLocaleString() : "0"}</span>
                </span>
                <span className="text-sm-custom text-text-body">
                  Estimated Total: <span className="font-semibold text-text-default">Rs {estimatedTotal.toLocaleString()}</span>
                  {hasUnpricedRows && <span className="text-xs text-text-muted ml-1">(some items have no price history)</span>}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {activeProduct && (
        <VendorPricePanel
          product={activeProduct}
          onClose={() => setActiveProduct(null)}
          onSelectVendor={(price) => {
            if (activeRowKeyRef.current !== null) requestMoveToVendor(activeRowKeyRef.current, price);
          }}
        />
      )}

      {!sidePanelsContainer && sidePanels}
    </div>

      {sidePanelsContainer && createPortal(sidePanels, sidePanelsContainer)}

      <ConfirmDialog
        open={pendingMove !== null}
        title="Move Item"
        description={pendingMove ? `Move "${pendingMove.row.particular}" to ${pendingMove.target.vendor_name} at Rs ${pendingMove.target.rate}?` : undefined}
        confirmLabel="Move"
        onConfirm={confirmMove}
        onCancel={() => setPendingMove(null)}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete Item"
        description={
          pendingDelete?.type === "row"
            ? "This line item will be permanently removed. This cannot be undone."
            : `${selectedKeys.size} selected item(s) will be permanently removed. This cannot be undone.`
        }
        confirmLabel="Delete"
        onConfirm={pendingDelete?.type === "row" ? confirmRemoveRow : confirmDeleteSelected}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  );
}
