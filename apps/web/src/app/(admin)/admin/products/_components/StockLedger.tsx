"use client";

import { forwardRef, useEffect, useImperativeHandle, useMemo, useReducer, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { MoreVertical, Pencil, Trash2, Calendar, Filter as FilterIcon, Maximize2 } from "lucide-react";
import { DataTable } from "@/components/data-table/DataTable";
import { apiFetch } from "@/lib/api";
import { toast } from "@/lib/toast";
import { BsDateInput, isValidBsDate } from "@/components/ui/form/BsDateInput";
import { ComboboxField } from "@/components/ui/form/FormField";
import { FilterModal } from "@/app/(admin)/admin/accounts/_components/FilterModal";
import { TrashModal } from "./TrashModal";

type TransactionItem = {
  ulid: string;
  date: string;
  type: "purchase" | "sale";
  purchase_quantity: number | null;
  purchase_price: number | null;
  sales_quantity: number | null;
  sales_price: number | null;
  cost_price: number | null;
  /** (sales_price - cost_price) * sales_quantity — null for purchase rows or pre-snapshot sales. */
  profit: number | null;
  /** Set when this entry was recorded as a line item on a vendor bill — only then does a "full bill" page exist to open. */
  reference_type: string | null;
  bill: {
    transaction_ulid: string;
    party_ulid: string;
    party_name: string;
    items: { product_name: string; quantity: number; rate: number; discount: number; total: number }[];
    discount_percent: number;
    taxable_amount: number;
    vat_amount: number;
    grand_total: number;
  } | null;
};

type Row = TransactionItem & { ulid: string };

const inputCls = "w-full text-sm text-black border-0 focus:outline-none focus:ring-1 focus:ring-inset focus:ring-slate-400 bg-transparent px-2 py-1.5 rounded-none placeholder:text-text-muted";
const amountCls = "w-full text-sm font-semibold text-black border-0 bg-transparent px-2 py-1.5 rounded-none cursor-not-allowed";

const PARTICULAR_OPTIONS = [
  { value: "purchase", label: "Purchase" },
  { value: "sale", label: "Sale" },
];

function ParticularCombobox({ resetKey, initialValue, onChange }: { resetKey: string | number; initialValue: string; onChange: (val: string) => void }) {
  const [value, setValue] = useState(initialValue);
  return (
    <div className="absolute inset-0 [&_input]:!h-full [&_input]:!w-full [&_input]:!text-sm [&_input]:!font-medium [&_input]:!text-black [&_input]:!border-0 [&_input]:!ring-0 [&_input]:!shadow-none [&_input]:!bg-transparent [&_input]:!px-2 [&_input]:focus:!outline-none [&_input]:focus:!ring-0 [&_input]:focus:!border-0 [&_.mt-1]:mt-0">
      <ComboboxField
        key={resetKey}
        label=""
        options={PARTICULAR_OPTIONS}
        value={value}
        onChange={(v) => { setValue(v); onChange(v); }}
        autoFocus
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
  /** Opens the shared Fiscal Year modal — owned by the parent since it's also used elsewhere. */
  onFiscalYearClick?: () => void;
  /** Single click on a saved row — parent renders the quick-view/edit side panel. */
  onItemClick?: (item: TransactionItem) => void;
}>(function StockLedger({ productUlid, currentStock, openingQuantity, fiscalYearName, onOpeningBalanceClick, onFiscalYearClick, onItemClick }, ref) {
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

  const [showFullDetails, setShowFullDetails] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["product-transaction-items", productUlid],
    queryFn: () => apiFetch<{ data: TransactionItem[] }>(`/products/${productUlid}/product-transaction-items?per_page=1000`),
    enabled: !!productUlid,
  });

  const allItems = data?.data ?? [];

  // Date-range filter (via the "Filter" more-action) — applied client-side since the whole
  // ledger is already fetched in one page.
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [dateFromDraft, setDateFromDraft] = useState("");
  const [dateToDraft, setDateToDraft] = useState("");
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [filterResetKey, setFilterResetKey] = useState(0);

  const rawItems = allItems.filter((it) => (!dateFrom || it.date >= dateFrom) && (!dateTo || it.date <= dateTo));

  const [trashModalOpen, setTrashModalOpen] = useState(false);
  const { data: trashedData, isLoading: trashedLoading } = useQuery({
    queryKey: ["product-transaction-items-trashed", productUlid],
    queryFn: () => apiFetch<{ data: TransactionItem[] }>(`/products/${productUlid}/product-transaction-items/trashed`),
    enabled: !!productUlid && trashModalOpen,
  });

  function invalidateAfterChange() {
    queryClient.invalidateQueries({ queryKey: ["product-transaction-items", productUlid] });
    queryClient.invalidateQueries({ queryKey: ["product-transaction-items-trashed", productUlid] });
    queryClient.invalidateQueries({ queryKey: ["products"] });
    queryClient.invalidateQueries({ queryKey: ["products-sidebar"] });
  }

  const restoreMutation = useMutation({
    mutationFn: (itemUlid: string) => apiFetch(`/products/${productUlid}/product-transaction-items/${itemUlid}/restore`, { method: "POST" }),
    onSuccess: () => {
      invalidateAfterChange();
      toast.success("Entry restored", "Stock transaction has been restored.");
    },
    onError: () => toast.error("Failed to restore", "Could not restore the transaction."),
  });

  function escapeHtml(value: string): string {
    return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function exportableRows() {
    return rawItems.map((it, i) => {
      const isPurchase = it.type === "purchase";
      return {
        date: it.date,
        particular: isPurchase ? "Purchase" : "Sale",
        qty: String((isPurchase ? it.purchase_quantity : it.sales_quantity) ?? ""),
        rate: String((isPurchase ? it.purchase_price : it.sales_price) ?? ""),
        balance: String((openingQuantity ?? 0) + rawItems.slice(0, i + 1).reduce((acc, r) => acc + (r.purchase_quantity ?? 0) - (r.sales_quantity ?? 0), 0)),
      };
    });
  }

  function handlePrintLedger() {
    const rows = exportableRows();
    const win = window.open("", "_blank");
    if (!win) return;
    const title = "Stock Ledger";
    const rowsHtml = rows.map((r) => `
      <tr>
        <td>${escapeHtml(r.date)}</td>
        <td>${escapeHtml(r.particular)}</td>
        <td class="num">${r.qty}</td>
        <td class="num">${r.rate ? Number(r.rate).toLocaleString() : ""}</td>
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
      <h2>${escapeHtml(title)}</h2>
      <table>
        <thead><tr><th>Date</th><th>Particular</th><th class="num">Qty</th><th class="num">Rate</th><th class="num">Balance</th></tr></thead>
        <tbody>${rowsHtml}</tbody>
      </table>
    </body></html>`);
    win.document.close();
    win.focus();
    win.print();
  }

  function handleExportLedgerCsv() {
    const rows = exportableRows();
    const header = ["Date", "Particular", "Qty", "Rate", "Balance"];
    const csvEscape = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
    const lines = [header, ...rows.map((r) => [r.date, r.particular, r.qty, r.rate, r.balance])]
      .map((cols) => cols.map(csvEscape).join(","))
      .join("\n");
    const blob = new Blob([lines], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "stock-ledger.csv";
    a.click();
    URL.revokeObjectURL(url);
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
    // Only a bill-linked entry has an actual vendor/customer bill to open — for a standalone
    // entry there's no bill, and the quick-view side panel already covers every field.
    if (!row.bill) return;
    if (row.type === "purchase") {
      router.push(`/admin/accounts/goods-purchased?vendor=${row.bill.party_ulid}&transaction=${row.bill.transaction_ulid}&product=${productUlid}`);
    } else {
      router.push(`/admin/customers/goods-sold?customer=${row.bill.party_ulid}&transaction=${row.bill.transaction_ulid}&product=${productUlid}`);
    }
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
    cost_price: null,
    profit: null,
    reference_type: null,
    bill: null,
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
    cost_price: null,
    profit: null,
    reference_type: null,
    bill: null,
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
            className={inputCls}
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
        const bill = row.original.bill;
        return (
          <div className="py-0.5">
            <span className="block mb-1 text-sm font-medium text-black">{row.original.type === "purchase" ? "Purchase" : "Sale"}</span>
            {showFullDetails && bill && (
              <div className="border-l-2 border-slate-200 pl-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-text-muted/70 truncate" title={bill.party_name}>
                  {bill.party_name}
                </p>
                <div className="grid grid-cols-[1fr_44px_64px_56px_64px] gap-x-2 text-[10px] font-semibold uppercase tracking-wide text-text-muted/70">
                  <span>Item</span>
                  <span className="text-right">Qty</span>
                  <span className="text-right">Rate</span>
                  <span className="text-right">Disc</span>
                  <span className="text-right">Total</span>
                </div>
                {bill.items.map((it, i) => (
                  <div key={i} className="grid grid-cols-[1fr_44px_64px_56px_64px] gap-x-2 text-[11px] leading-tight text-text-muted">
                    <span className="truncate text-text-default" title={it.product_name}>{it.product_name}</span>
                    <span className="text-right">{it.quantity}</span>
                    <span className="text-right">{it.rate.toLocaleString()}</span>
                    <span className="text-right">{it.discount.toLocaleString()}</span>
                    <span className="text-right font-semibold text-text-default">{it.total.toLocaleString()}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between text-[11px] font-semibold text-text-default pt-0.5 border-t border-slate-100 mt-0.5">
                  <span>Grand Total</span>
                  <span>{bill.grand_total.toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>
        );
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
                  className={`${inputCls} disabled:bg-transparent disabled:text-text-muted disabled:cursor-not-allowed`}
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
                  className={`${inputCls} disabled:bg-transparent disabled:text-text-muted disabled:cursor-not-allowed`}
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
                  className={`${inputCls} disabled:bg-transparent disabled:text-text-muted disabled:cursor-not-allowed`}
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
                  className={`${inputCls} disabled:bg-transparent disabled:text-text-muted disabled:cursor-not-allowed`}
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
      id: "profit",
      header: "Profit",
      size: 90,
      meta: { borderLeft: true },
      cell: ({ row }) => {
        if (row.original.ulid === "__new__" || row.original.ulid === "__opening_balance__") return null;
        const profit = row.original.profit;
        if (profit == null) return null;
        return (
          <span className={`text-sm font-semibold ${profit < 0 ? "text-red-600" : "text-emerald-600"}`}>
            {profit.toLocaleString()}
          </span>
        );
      },
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
  ], [productUlid, presetNonce, openMenuUlid, showFullDetails]);

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
      onPrint={handlePrintLedger}
      onExportCsv={handleExportLedgerCsv}
      moreActions={[
        { label: showFullDetails ? "Hide Full" : "Show Full", icon: Maximize2, onClick: () => setShowFullDetails((v) => !v) },
        ...(onFiscalYearClick ? [{ label: "Fiscal Year", icon: Calendar, onClick: onFiscalYearClick }] : []),
        { label: dateFrom || dateTo ? "Filter (active)" : "Filter", icon: FilterIcon, onClick: () => { setDateFromDraft(dateFrom); setDateToDraft(dateTo); setFilterModalOpen(true); } },
        { label: "Recently Deleted", icon: Trash2, onClick: () => setTrashModalOpen(true) },
      ]}
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
        {(() => {
          const item = rawItems.find((it) => it.ulid === openMenuUlid);
          if (item?.bill) {
            // Bill-linked — editing/deleting here would desync the bill's own line item from
            // what actually happened to stock. Send them to the bill instead.
            return (
              <button
                type="button"
                onClick={() => {
                  setOpenMenuUlid(null);
                  setMenuPos(null);
                  openDetailPage(item as Row);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-text-default hover:bg-slate-50 cursor-pointer"
              >
                <Pencil className="h-3.5 w-3.5" /> View in bill
              </button>
            );
          }
          return (
            <>
              <button
                type="button"
                onClick={() => {
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
            </>
          );
        })()}
      </div>,
      document.body
    )}

    <FilterModal
      open={filterModalOpen}
      onClose={() => setFilterModalOpen(false)}
      dateFrom={dateFrom}
      dateTo={dateTo}
      dateFromDraft={dateFromDraft}
      dateToDraft={dateToDraft}
      resetKey={filterResetKey}
      onDateFromDraftChange={setDateFromDraft}
      onDateToDraftChange={setDateToDraft}
      onApply={() => { setDateFrom(dateFromDraft); setDateTo(dateToDraft); setFilterModalOpen(false); }}
      onClearAll={() => {
        setDateFrom(""); setDateTo(""); setDateFromDraft(""); setDateToDraft("");
        setFilterResetKey((k) => k + 1);
        setFilterModalOpen(false);
      }}
    />

    <TrashModal
      open={trashModalOpen}
      onClose={() => setTrashModalOpen(false)}
      loading={trashedLoading}
      items={trashedData?.data ?? []}
      restoring={restoreMutation.isPending}
      onRestore={(itemUlid) => restoreMutation.mutate(itemUlid)}
    />
    </>
  );
});
