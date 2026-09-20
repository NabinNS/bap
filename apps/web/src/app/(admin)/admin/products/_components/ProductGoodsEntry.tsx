"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2, Plus, ArrowLeft, ListOrdered, Check } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { toast } from "@/lib/toast";
import { BsDateInput, getTodayBs, isValidBsDate } from "@/components/ui/form/BsDateInput";
import { StockSidebar } from "./StockSidebar";

type Meta = { total: number; per_page: number; current_page: number; last_page: number; from: number; to: number };

type FiscalYear = { id: number; ulid: string; name: string };

type Product = {
  ulid: string;
  name: string;
  category: { ulid: string; name: string } | null;
  stock: number;
  stock_balances?: { fiscal_year_id: number; opening_quantity: number; remaining_quantity: number }[];
};

type SavedTransactionItem = {
  ulid: string;
  date: string;
  type: "purchase" | "sale";
  fiscal_year_id: number | null;
  purchase_quantity: number | null;
  purchase_price: number | null;
  sales_quantity: number | null;
  sales_price: number | null;
};

type LineItem = {
  key: number;
  quantity: string;
  rate: string;
  saved: boolean;
  itemUlid: string | null;
  /** True for a row loaded via ?item= — stays input-editable (PATCH on blur) even once saved. */
  keepEditable: boolean;
};

let nextKey = 1;
function emptyRow(): LineItem {
  return { key: nextKey++, quantity: "", rate: "", saved: false, itemUlid: null, keepEditable: false };
}

const inputCls = "w-full text-sm font-medium text-black border border-slate-300 focus:outline-none focus:border-slate-600 bg-white px-2 py-1.5 rounded-none";

export function ProductGoodsEntry({ type }: { type: "purchase" | "sale" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const productParam = searchParams.get("product");
  const itemParam = searchParams.get("item");
  const queryClient = useQueryClient();

  const isEditing = !!itemParam;
  const title = isEditing
    ? (type === "purchase" ? "Edit Purchase" : "Edit Sale")
    : (type === "purchase" ? "Goods Purchased" : "Goods Sales");
  const subtitle = isEditing
    ? "Update this stock entry."
    : (type === "purchase" ? "Record a stock purchase for a product." : "Record a stock sale for a product.");

  const [sideSearch, setSideSearch] = useState("");
  const [selectedProductUlid, setSelectedProductUlid] = useState<string | null>(productParam);
  const [rows, setRows] = useState<LineItem[]>([emptyRow()]);
  const [entryDate, setEntryDate] = useState(getTodayBs);
  const [fiscalYearId, setFiscalYearId] = useState<number | null>(null);
  const savingKeysRef = useRef<Set<number>>(new Set());

  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ["products-sidebar"],
    queryFn: () => apiFetch<{ data: Product[]; meta: Meta }>("/products?per_page=200&sort_by=name&sort_dir=asc"),
  });

  const { data: settingsData } = useQuery({
    queryKey: ["settings"],
    queryFn: () => apiFetch<{ data: { fiscal_year_id: number | null } }>("/settings"),
  });
  const activeFiscalYearId = settingsData?.data?.fiscal_year_id ?? null;

  const { data: fiscalYearsData } = useQuery({
    queryKey: ["fiscal-years"],
    queryFn: () => apiFetch<{ data: FiscalYear[] }>("/fiscal-years"),
    staleTime: Infinity,
  });
  const fiscalYears = fiscalYearsData?.data ?? [];

  const products = productsData?.data ?? [];
  const selectedProduct = products.find((p) => p.ulid === selectedProductUlid) ?? null;

  const { data: existingItemsData } = useQuery({
    queryKey: ["product-transaction-items", selectedProduct?.ulid],
    queryFn: () => apiFetch<{ data: SavedTransactionItem[] }>(`/products/${selectedProduct!.ulid}/product-transaction-items?per_page=1000`),
    enabled: !!selectedProduct && isEditing,
  });

  const loadedItemRef = useRef<string | null>(null);

  useEffect(() => {
    if (!selectedProductUlid && products.length > 0) setSelectedProductUlid(products[0].ulid);
  }, [products]);

  // Starting a fresh entry whenever the product changes (unless we're loading a specific item to edit).
  useEffect(() => {
    if (isEditing) return;
    setRows([emptyRow()]);
    setEntryDate(getTodayBs());
  }, [selectedProductUlid, isEditing]);

  // Load the specific entry being edited, once its data arrives.
  useEffect(() => {
    if (!isEditing || !itemParam || loadedItemRef.current === itemParam) return;
    const item = existingItemsData?.data.find((it) => it.ulid === itemParam);
    if (!item) return;
    loadedItemRef.current = itemParam;
    setEntryDate(item.date);
    setFiscalYearId(item.fiscal_year_id);
    setRows([{
      key: nextKey++,
      quantity: String(type === "purchase" ? item.purchase_quantity ?? "" : item.sales_quantity ?? ""),
      rate: String(type === "purchase" ? item.purchase_price ?? "" : item.sales_price ?? ""),
      saved: true,
      itemUlid: item.ulid,
      keepEditable: true,
    }]);
  }, [isEditing, itemParam, existingItemsData, type]);

  useEffect(() => {
    if (isEditing) return;
    if (fiscalYearId === null && activeFiscalYearId !== null) setFiscalYearId(activeFiscalYearId);
  }, [activeFiscalYearId, fiscalYearId, isEditing]);

  function selectProduct(ulid: string) {
    setSelectedProductUlid(ulid);
    router.replace(`/admin/products/${type === "purchase" ? "goods-purchased" : "goods-sold"}?product=${ulid}`);
  }

  function updateRow(key: number, field: "quantity" | "rate", value: string) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, [field]: value } : r)));
  }

  function rowAmount(row: LineItem): number {
    return (parseFloat(row.quantity) || 0) * (parseFloat(row.rate) || 0);
  }

  const totalQuantity = rows.reduce((sum, r) => sum + (parseFloat(r.quantity) || 0), 0);
  const totalAmount = rows.reduce((sum, r) => sum + rowAmount(r), 0);

  const createItemMutation = useMutation({
    mutationFn: ({ productUlid, payload }: { productUlid: string; payload: object }) =>
      apiFetch<{ data: { ulid: string } }>(`/products/${productUlid}/product-transaction-items`, { method: "POST", body: JSON.stringify(payload) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products-sidebar"] });
      queryClient.invalidateQueries({ queryKey: ["product-transaction-items"] });
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ productUlid, itemUlid, payload }: { productUlid: string; itemUlid: string; payload: object }) =>
      apiFetch(`/products/${productUlid}/product-transaction-items/${itemUlid}`, { method: "PATCH", body: JSON.stringify(payload) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products-sidebar"] });
      queryClient.invalidateQueries({ queryKey: ["product-transaction-items"] });
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: ({ productUlid, itemUlid }: { productUlid: string; itemUlid: string }) =>
      apiFetch(`/products/${productUlid}/product-transaction-items/${itemUlid}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products-sidebar"] });
      queryClient.invalidateQueries({ queryKey: ["product-transaction-items"] });
    },
  });

  function addRow() {
    setRows((prev) => [...prev, emptyRow()]);
  }

  function removeRow(key: number) {
    const row = rows.find((r) => r.key === key);
    if (!row || !selectedProduct) return;
    if (row.saved && row.itemUlid) {
      if (!confirm("Delete this entry?")) return;
      deleteItemMutation.mutate(
        { productUlid: selectedProduct.ulid, itemUlid: row.itemUlid },
        { onSuccess: () => setRows((prev) => prev.filter((r) => r.key !== key)) }
      );
      return;
    }
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.key !== key) : prev));
  }

  async function trySaveRow(key: number) {
    if (!selectedProduct || !isValidBsDate(entryDate) || !fiscalYearId) return;
    if (savingKeysRef.current.has(key)) return;

    const row = rows.find((r) => r.key === key);
    if (!row) return;
    if (row.saved && !row.itemUlid) return;
    if (!row.quantity || Number(row.quantity) <= 0 || row.rate === "") return;

    const payload = {
      date: entryDate,
      type,
      fiscal_year_id: fiscalYearId,
      purchase_quantity: type === "purchase" ? Number(row.quantity) : null,
      purchase_price: type === "purchase" ? Number(row.rate) : null,
      sales_quantity: type === "sale" ? Number(row.quantity) : null,
      sales_price: type === "sale" ? Number(row.rate) : null,
    };

    savingKeysRef.current.add(key);
    try {
      if (row.itemUlid) {
        await updateItemMutation.mutateAsync({ productUlid: selectedProduct.ulid, itemUlid: row.itemUlid, payload });
        toast.success("Entry updated", "The stock entry has been updated.");
        return;
      }

      const res = await createItemMutation.mutateAsync({ productUlid: selectedProduct.ulid, payload });
      setRows((prev) => prev.map((r) => (r.key === key ? { ...r, saved: true, itemUlid: res.data.ulid } : r)));
    } catch {
      toast.error("Failed to save", "Could not save this entry.");
    } finally {
      savingKeysRef.current.delete(key);
    }
  }

  return (
    <div className="flex gap-0 transition-all duration-300 h-full">
      <div className="flex-1 min-w-0 flex flex-col p-6 gap-6 h-full">
        <nav className="flex items-center gap-1.5 text-sm text-text-muted">
          <Link href="/admin" className="hover:text-text-default transition-colors">Dashboard</Link>
          <span>/</span>
          <Link href="/admin/products" className="hover:text-text-default transition-colors">Product/Stock</Link>
          <span>/</span>
          <span className="text-text-default font-medium">{title}</span>
        </nav>

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-h3 font-bold text-text-default">{title}</h2>
            <p className="text-sm text-text-muted mt-0.5">{subtitle}</p>
          </div>
          <div className="flex items-center shrink-0">
            <Link
              href={selectedProduct ? `/admin/products?product=${selectedProduct.ulid}` : "/admin/products"}
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
          {/* Side card: product list */}
          <StockSidebar
            products={products}
            loading={productsLoading}
            activeFiscalYearId={activeFiscalYearId}
            selectedProductUlid={selectedProduct?.ulid}
            search={sideSearch}
            onSearchChange={setSideSearch}
            onSelect={(product) => selectProduct(product.ulid)}
            onDelete={() => {}}
          />

          {/* Right side: detail card + line item table */}
          <div className="flex-1 min-w-0 flex flex-col gap-4 self-start">
            <div className="bg-white px-5 py-4 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-lg font-bold text-text-default leading-tight flex items-center gap-1.5">
                    {selectedProduct ? (
                      <>
                        <span className="text-base font-medium text-text-muted">Name:</span>
                        {selectedProduct.name}
                      </>
                    ) : (
                      <span className="text-text-muted font-normal text-sm">Select a product</span>
                    )}
                  </p>
                  {selectedProduct?.category && (
                    <p className="text-sm-custom text-text-body mt-1">
                      <span className="font-medium text-text-muted">Category:</span> {selectedProduct.category.name}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-2 shrink-0 w-48">
                  {fiscalYears.length > 0 && (
                    <select
                      value={fiscalYearId ?? ""}
                      onChange={(e) => setFiscalYearId(Number(e.target.value))}
                      className="w-full h-8 px-2 text-sm font-medium text-black border border-slate-300 focus:outline-none focus:border-slate-500 bg-white"
                    >
                      {fiscalYears.map((fy) => (
                        <option key={fy.id} value={fy.id}>{fy.name}</option>
                      ))}
                    </select>
                  )}
                  <BsDateInput value={entryDate} onChange={setEntryDate} />
                </div>
              </div>
            </div>

            {/* Line item table */}
            <div className="border border-slate-300 bg-white flex flex-col overflow-x-auto">
              <div className="grid grid-cols-[50px_1fr_170px_160px_130px_50px] min-w-[760px] bg-black">
                <span className="px-3 py-2.5 text-xs font-semibold text-white uppercase tracking-wide">S.N.</span>
                <span className="px-3 py-2.5 text-xs font-semibold text-white uppercase tracking-wide">Particulars</span>
                <span className="px-3 py-2.5 text-xs font-semibold text-white uppercase tracking-wide">Quantity</span>
                <span className="px-3 py-2.5 text-xs font-semibold text-white uppercase tracking-wide">Rate</span>
                <span className="px-3 py-2.5 text-xs font-semibold text-white uppercase tracking-wide">Amount</span>
                <span></span>
              </div>

              {rows.map((row, idx) => (
                <div
                  key={row.key}
                  onBlur={(e) => {
                    if ((!row.saved || row.keepEditable) && !e.currentTarget.contains(e.relatedTarget as Node)) trySaveRow(row.key);
                  }}
                  className="grid grid-cols-[50px_1fr_170px_160px_130px_50px] min-w-[760px] border-b border-slate-200 items-center"
                >
                  <span className="px-3 py-2 text-sm font-medium text-black">{idx + 1}</span>

                  <span className="px-3 py-2 text-sm font-medium text-black flex items-center gap-1.5">
                    {type === "purchase" ? "Purchase" : "Sale"}
                    {row.saved && <Check className="h-3.5 w-3.5 text-green-600 shrink-0" />}
                  </span>

                  {row.saved && !row.keepEditable ? (
                    <>
                      <span className="px-3 py-2 text-sm font-medium text-black">{row.quantity}</span>
                      <span className="px-3 py-2 text-sm font-medium text-black">{Number(row.rate).toLocaleString()}</span>
                    </>
                  ) : (
                    <>
                      <div className="px-3 py-1.5">
                        <input
                          type="number"
                          min="0"
                          autoComplete="off"
                          value={row.quantity}
                          onChange={(e) => updateRow(row.key, "quantity", e.target.value)}
                          placeholder="0"
                          className={inputCls}
                        />
                      </div>
                      <div className="px-3 py-1.5">
                        <input
                          type="number"
                          min="0"
                          autoComplete="off"
                          value={row.rate}
                          onChange={(e) => updateRow(row.key, "rate", e.target.value)}
                          placeholder="0.00"
                          className={inputCls}
                        />
                      </div>
                    </>
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

              <div className="px-4 py-2.5 flex items-center min-w-[760px]">
                <button
                  onClick={addRow}
                  className="flex items-center gap-1.5 text-sm font-semibold text-text-default hover:text-black transition-colors cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Row
                </button>
              </div>

              <div className="grid grid-cols-[50px_1fr_170px_160px_130px_50px] min-w-[760px] border-t border-slate-100">
                <div className="col-span-2 px-4 py-3 flex items-baseline gap-1.5">
                  <span className="text-sm-custom text-text-body">Total Quantity</span>
                  <span className="text-sm-custom font-semibold text-text-default">{totalQuantity ? totalQuantity.toLocaleString() : "0"}</span>
                </div>
                <div className="col-span-3 border-l border-slate-100 flex items-center justify-end px-4 py-3 bg-slate-50">
                  <span className="text-sm-custom font-bold text-text-default mr-2">Total Amount</span>
                  <span className="text-sm-custom font-bold text-text-default">{totalAmount.toLocaleString()}</span>
                </div>
                <div></div>
              </div>

              <div className="flex items-center justify-end px-4 py-3 border-t border-slate-100">
                <button
                  onClick={() => router.push(selectedProduct ? `/admin/products?product=${selectedProduct.ulid}` : "/admin/products")}
                  className="px-6 py-2 text-sm font-semibold text-text-default border border-slate-300 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    toast.success(type === "purchase" ? "Purchase recorded" : "Sale recorded", "The entry has been saved.");
                    router.push(selectedProduct ? `/admin/products?product=${selectedProduct.ulid}` : "/admin/products");
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
    </div>
  );
}
