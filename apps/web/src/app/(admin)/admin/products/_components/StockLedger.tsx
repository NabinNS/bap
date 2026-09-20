"use client";

import { forwardRef, useEffect, useImperativeHandle, useMemo, useReducer, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { DataTable } from "@/components/data-table/DataTable";
import { apiFetch } from "@/lib/api";
import { toast } from "@/lib/toast";
import { BsDateInput, isValidBsDate } from "@/components/ui/form/BsDateInput";
import { ComboboxField } from "@/components/ui/form/FormField";

type TransactionItem = {
  ulid: string;
  date: string;
  type: "purchase" | "sale";
  purchase_quantity: number | null;
  purchase_price: number | null;
  sales_quantity: number | null;
  sales_price: number | null;
};

type Row = TransactionItem & { ulid: string };

const inputCls = "w-full text-sm font-medium text-black border border-slate-300 focus:outline-none focus:border-slate-600 bg-white px-2 py-1 rounded-none";
const amountCls = "w-full text-sm font-semibold text-black border border-slate-300 bg-slate-100 px-2 py-1 rounded-none cursor-not-allowed";

const PARTICULAR_OPTIONS = [
  { value: "purchase", label: "Purchase" },
  { value: "sale", label: "Sale" },
];

function ParticularCombobox({ resetKey, initialValue, onChange }: { resetKey: string | number; initialValue: string; onChange: (val: string) => void }) {
  const [value, setValue] = useState(initialValue);
  return (
    <div className="[&_input]:h-8 [&_input]:text-sm [&_input]:font-medium [&_input]:text-black [&_.mt-1]:mt-0">
      <ComboboxField
        key={resetKey}
        label=""
        options={PARTICULAR_OPTIONS}
        value={value}
        onChange={(v) => { setValue(v); onChange(v); }}
      />
    </div>
  );
}

function fiscalYearStartDate(name: string): string {
  // name like "2080/081" or "080/081" — start year is the first part
  const match = name.match(/(\d+)/);
  if (!match) return name;
  const year = match[1].length === 4 ? match[1].slice(1) : match[1]; // keep last 3 digits
  return `${year}-4-1`;
}

export type StockLedgerHandle = {
  /** Preps a fresh draft row for the given type and focuses its Qty field. */
  focusEntry: (type: "purchase" | "sale") => void;
};

export const StockLedger = forwardRef<StockLedgerHandle, {
  productUlid: string;
  currentStock: number;
  openingQuantity?: number | null;
  fiscalYearName?: string | null;
  onOpeningBalanceClick?: () => void;
  /** Single click on a saved row — parent renders the quick-view/edit side panel. */
  onItemClick?: (item: TransactionItem) => void;
}>(function StockLedger({ productUlid, currentStock, openingQuantity, fiscalYearName, onOpeningBalanceClick, onItemClick }, ref) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [, forceUpdate] = useReducer((x: number) => x + 1, 0);
  const [presetNonce, setPresetNonce] = useState(0);
  const draftRef = useRef({ date: "", type: "" as "" | "purchase" | "sale", purchase_quantity: "", purchase_price: "", sales_quantity: "", sales_price: "" });

  useImperativeHandle(ref, () => ({
    focusEntry(type) {
      draftRef.current.type = type;
      setPresetNonce((n) => n + 1);
      forceUpdate();
      requestAnimationFrame(() => {
        document.getElementById(type === "purchase" ? `pqty-${productUlid}` : `sqty-${productUlid}`)?.focus();
      });
    },
  }), [productUlid]);

  const { data, isLoading } = useQuery({
    queryKey: ["product-transaction-items", productUlid],
    queryFn: () => apiFetch<{ data: TransactionItem[] }>(`/products/${productUlid}/product-transaction-items?per_page=1000`),
    enabled: !!productUlid,
  });

  const rawItems = data?.data ?? [];

  function invalidateAfterChange() {
    queryClient.invalidateQueries({ queryKey: ["product-transaction-items", productUlid] });
    queryClient.invalidateQueries({ queryKey: ["products"] });
    queryClient.invalidateQueries({ queryKey: ["products-sidebar"] });
  }

  const saveMutation = useMutation({
    mutationFn: (payload: object) => apiFetch(`/products/${productUlid}/product-transaction-items`, { method: "POST", body: JSON.stringify(payload) }),
    onSuccess: () => {
      invalidateAfterChange();
      draftRef.current = { date: "", type: "", purchase_quantity: "", purchase_price: "", sales_quantity: "", sales_price: "" };
      forceUpdate();
      toast.success("Entry saved", "Stock transaction has been recorded.");
    },
    onError: () => toast.error("Failed to save", "Could not save the transaction."),
  });

  const deleteMutation = useMutation({
    mutationFn: (itemUlid: string) => apiFetch(`/products/${productUlid}/product-transaction-items/${itemUlid}`, { method: "DELETE" }),
    onSuccess: () => {
      invalidateAfterChange();
      toast.success("Entry deleted", "Stock transaction has been removed.");
    },
    onError: () => toast.error("Failed to delete", "Could not delete the transaction."),
  });

  const [openMenuUlid, setOpenMenuUlid] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuUlid(null);
        setMenuPos(null);
      }
    }
    if (openMenuUlid) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openMenuUlid]);

  function tryAutoSave() {
    const { date, type, purchase_quantity, purchase_price, sales_quantity, sales_price } = draftRef.current;
    if (!isValidBsDate(date) || !type) return;

    const isPurchase = type === "purchase";
    if (isPurchase && (!purchase_quantity || !purchase_price)) return;
    if (!isPurchase && (!sales_quantity || !sales_price)) return;

    saveMutation.mutate({
      date,
      type,
      purchase_quantity: isPurchase ? parseInt(purchase_quantity, 10) : null,
      purchase_price: isPurchase ? parseInt(purchase_price, 10) : null,
      sales_quantity: !isPurchase ? parseInt(sales_quantity, 10) : null,
      sales_price: !isPurchase ? parseInt(sales_price, 10) : null,
    });
  }

  function openDetailPage(row: Row) {
    const page = row.type === "purchase" ? "goods-purchased" : "goods-sold";
    router.push(`/admin/products/${page}?product=${productUlid}&item=${row.ulid}`);
  }

  // Opening balance is the product's saved ProductStockBalance.opening_quantity for the
  // active fiscal year (same idea as AccVendorBalance.opening_balance) — an explicit row,
  // not derived from currentStock, so it stays correct even when currentStock spans
  // multiple fiscal years.
  const openingBalance = openingQuantity ?? 0;

  const openingRow: Row = {
    ulid: "__opening_balance__",
    date: fiscalYearName ? fiscalYearStartDate(fiscalYearName) : "Opening",
    type: "purchase",
    purchase_quantity: null,
    purchase_price: null,
    sales_quantity: null,
    sales_price: null,
  };

  const itemBalances = rawItems.reduce<number[]>((acc, it) => {
    const prev = acc.length > 0 ? acc[acc.length - 1] : openingBalance;
    acc.push(prev + (it.purchase_quantity ?? 0) - (it.sales_quantity ?? 0));
    return acc;
  }, []);
  const runningBalances = [openingBalance, ...itemBalances];
  const runningBalancesRef = useRef<number[]>([]);
  runningBalancesRef.current = runningBalances;

  const draftRow: Row = {
    ulid: "__new__",
    date: draftRef.current.date,
    type: draftRef.current.type || "purchase",
    purchase_quantity: draftRef.current.purchase_quantity ? Number(draftRef.current.purchase_quantity) : null,
    purchase_price: draftRef.current.purchase_price ? Number(draftRef.current.purchase_price) : null,
    sales_quantity: draftRef.current.sales_quantity ? Number(draftRef.current.sales_quantity) : null,
    sales_price: draftRef.current.sales_price ? Number(draftRef.current.sales_price) : null,
  };

  const rows: Row[] = [openingRow, ...rawItems, draftRow];

  const columns: ColumnDef<Row, unknown>[] = useMemo(() => [
    {
      accessorKey: "date",
      header: "Date",
      size: 130,
      cell: ({ row }) => {
        if (row.original.ulid === "__new__") return (
          <BsDateInput
            key={`date-${productUlid}`}
            value=""
            onChange={(val) => { draftRef.current.date = val; }}
          />
        );
        return <span className="text-sm font-medium text-black">{row.original.date}</span>;
      },
    },
    {
      id: "particular",
      header: "Particular",
      size: 180,
      meta: { borderLeft: true },
      cell: ({ row }) => {
        if (row.original.ulid === "__opening_balance__") return <span className="text-sm font-medium text-black">Opening Balance</span>;
        if (row.original.ulid === "__new__") return (
          <ParticularCombobox
            resetKey={`particular-${productUlid}-${presetNonce}`}
            initialValue={draftRef.current.type}
            onChange={(v) => { draftRef.current.type = v as "purchase" | "sale"; forceUpdate(); }}
          />
        );
        return <span className="text-sm font-medium text-black">{row.original.type === "purchase" ? "Purchase" : "Sale"}</span>;
      },
    },
    {
      id: "purchase",
      header: "Purchase",
      size: 270,
      meta: { borderLeft: true },
      columns: [
        {
          id: "purchase_quantity",
          header: "Qty",
          size: 90,
          meta: { borderLeft: true },
          cell: ({ row }) => {
            if (row.original.ulid === "__new__") {
              const disabled = draftRef.current.type !== "purchase";
              return (
                <input
                  key={`pqty-${productUlid}`}
                  id={`pqty-${productUlid}`}
                  type="number"
                  min="0"
                  defaultValue=""
                  disabled={disabled}
                  onChange={(e) => { draftRef.current.purchase_quantity = e.target.value; forceUpdate(); }}
                  placeholder="0"
                  className={`${inputCls} disabled:bg-slate-100 disabled:cursor-not-allowed`}
                />
              );
            }
            return row.original.purchase_quantity != null ? <span className="text-sm text-black">{row.original.purchase_quantity}</span> : null;
          },
        },
        {
          id: "purchase_price",
          header: "Rate",
          size: 90,
          meta: { borderLeft: true },
          cell: ({ row }) => {
            if (row.original.ulid === "__new__") {
              const disabled = draftRef.current.type !== "purchase";
              return (
                <input
                  key={`prate-${productUlid}`}
                  type="number"
                  min="0"
                  defaultValue=""
                  disabled={disabled}
                  onChange={(e) => { draftRef.current.purchase_price = e.target.value; forceUpdate(); }}
                  placeholder="0"
                  className={`${inputCls} disabled:bg-slate-100 disabled:cursor-not-allowed`}
                />
              );
            }
            return row.original.purchase_price != null ? <span className="text-sm text-black">{row.original.purchase_price.toLocaleString()}</span> : null;
          },
        },
        {
          id: "purchase_amount",
          header: "Amount",
          size: 90,
          meta: { borderLeft: true },
          cell: ({ row }) => {
            const qty = row.original.purchase_quantity;
            const rate = row.original.purchase_price;
            const amount = qty != null && rate != null ? qty * rate : null;
            if (row.original.ulid === "__new__") return <input type="text" readOnly value={amount != null ? amount.toLocaleString() : ""} className={amountCls} />;
            return amount != null ? <span className="text-sm font-semibold text-black">{amount.toLocaleString()}</span> : null;
          },
        },
      ],
    },
    {
      id: "sales",
      header: "Sales",
      size: 270,
      meta: { borderLeft: true },
      columns: [
        {
          id: "sales_quantity",
          header: "Qty",
          size: 90,
          meta: { borderLeft: true },
          cell: ({ row }) => {
            if (row.original.ulid === "__new__") {
              const disabled = draftRef.current.type !== "sale";
              return (
                <input
                  key={`sqty-${productUlid}`}
                  id={`sqty-${productUlid}`}
                  type="number"
                  min="0"
                  defaultValue=""
                  disabled={disabled}
                  onChange={(e) => { draftRef.current.sales_quantity = e.target.value; forceUpdate(); }}
                  placeholder="0"
                  className={`${inputCls} disabled:bg-slate-100 disabled:cursor-not-allowed`}
                />
              );
            }
            return row.original.sales_quantity != null ? <span className="text-sm text-black">{row.original.sales_quantity}</span> : null;
          },
        },
        {
          id: "sales_price",
          header: "Rate",
          size: 90,
          meta: { borderLeft: true },
          cell: ({ row }) => {
            if (row.original.ulid === "__new__") {
              const disabled = draftRef.current.type !== "sale";
              return (
                <input
                  key={`srate-${productUlid}`}
                  type="number"
                  min="0"
                  defaultValue=""
                  disabled={disabled}
                  onChange={(e) => { draftRef.current.sales_price = e.target.value; forceUpdate(); }}
                  placeholder="0"
                  className={`${inputCls} disabled:bg-slate-100 disabled:cursor-not-allowed`}
                />
              );
            }
            return row.original.sales_price != null ? <span className="text-sm text-black">{row.original.sales_price.toLocaleString()}</span> : null;
          },
        },
        {
          id: "sales_amount",
          header: "Amount",
          size: 90,
          meta: { borderLeft: true },
          cell: ({ row }) => {
            const qty = row.original.sales_quantity;
            const rate = row.original.sales_price;
            const amount = qty != null && rate != null ? qty * rate : null;
            if (row.original.ulid === "__new__") return <input type="text" readOnly value={amount != null ? amount.toLocaleString() : ""} className={amountCls} />;
            return amount != null ? <span className="text-sm font-semibold text-black">{amount.toLocaleString()}</span> : null;
          },
        },
      ],
    },
    {
      id: "balance",
      header: "Balance",
      size: 100,
      meta: { borderLeft: true },
      cell: ({ row }) => {
        if (row.original.ulid === "__new__") return null;
        const balance = runningBalancesRef.current[row.index];
        return <span className="text-sm font-semibold text-black">{balance != null ? balance.toLocaleString() : null}</span>;
      },
    },
    {
      id: "actions",
      header: "",
      size: 40,
      meta: { borderLeft: true },
      cell: ({ row }) => {
        if (row.original.ulid === "__new__" || row.original.ulid === "__opening_balance__") return null;
        return (
          <button
            onClick={(e) => {
              e.stopPropagation();
              const ulid = row.original.ulid;
              if (openMenuUlid === ulid) { setOpenMenuUlid(null); setMenuPos(null); return; }
              const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
              setMenuPos({ top: rect.bottom + 4, left: rect.right - 144 });
              setOpenMenuUlid(ulid);
            }}
            className="p-1 rounded hover:bg-slate-200 transition-colors text-text-muted hover:text-text-default cursor-pointer"
          >
            <MoreVertical className="h-3.5 w-3.5" />
          </button>
        );
      },
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- draftRef/forceUpdate are stable
  ], [productUlid, presetNonce, openMenuUlid]);

  return (
    <>
    <DataTable
      columns={columns}
      data={rows}
      loading={isLoading}
      searchPlaceholder="Search transactions..."
      hidePagination
      fillHeight
      scrollToBottomOnLoad
      scrollToBottomKey={`${productUlid}:${rawItems.length}:${presetNonce}`}
      tableClassName="table-fixed"
      onRowBlur={(row) => { if (row.ulid === "__new__") tryAutoSave(); }}
      onRowClick={(row) => {
        if (row.ulid === "__opening_balance__") onOpeningBalanceClick?.();
        else if (row.ulid !== "__new__") onItemClick?.(row);
      }}
      onRowDoubleClick={(row) => {
        if (row.ulid !== "__new__" && row.ulid !== "__opening_balance__") openDetailPage(row);
      }}
    />

    {openMenuUlid && menuPos && typeof document !== "undefined" && createPortal(
      <div
        ref={menuRef}
        style={{ position: "fixed", top: menuPos.top, left: menuPos.left, zIndex: 9999 }}
        className="w-36 bg-white border border-slate-200 shadow-md"
      >
        <button
          type="button"
          onClick={() => {
            const item = rawItems.find((it) => it.ulid === openMenuUlid);
            if (item) onItemClick?.(item);
            setOpenMenuUlid(null);
            setMenuPos(null);
          }}
          className="flex w-full items-center gap-2 px-3 py-2 text-sm text-text-default hover:bg-slate-50 cursor-pointer"
        >
          <Pencil className="h-3.5 w-3.5" /> Edit
        </button>
        <button
          type="button"
          onClick={() => {
            const ulid = openMenuUlid;
            setOpenMenuUlid(null);
            setMenuPos(null);
            if (ulid && confirm("Delete this entry?")) deleteMutation.mutate(ulid);
          }}
          className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer"
        >
          <Trash2 className="h-3.5 w-3.5" /> Delete
        </button>
      </div>,
      document.body
    )}
    </>
  );
});
