"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Pencil, MoreVertical, Plus, Trash2, Filter as FilterIcon } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { numberToWords } from "@/lib/numberToWords";
import { toast } from "@/lib/toast";
import { Modal } from "@/components/ui/Modal";
import { BsDateInput } from "@/components/ui/form/BsDateInput";

type BillItem = {
  ulid: string;
  product_ulid: string;
  product_name: string;
  quantity: number;
  rate: number;
  amount: number;
  discount: number;
  total: number;
};

type PurchaseBill = {
  ulid: string;
  fiscal_year_id: number | null;
  vendor: { ulid: string; name: string; address: string | null; vat_no: string | null } | null;
  date: string;
  particular: string;
  voucher_no: string | null;
  payment_type: string | null;
  discount_percent: number | null;
  discount_amount: number | null;
  taxable_amount: number | null;
  vat_amount: number | null;
  grand_total: number | null;
  items: BillItem[];
};

export default function PurchasePage() {
  const [search, setSearch] = useState("");
  const [selectedUlid, setSelectedUlid] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const headerMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    if (menuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (headerMenuRef.current && !headerMenuRef.current.contains(e.target as Node)) setHeaderMenuOpen(false);
    }
    if (headerMenuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [headerMenuOpen]);

  const queryClient = useQueryClient();
  const [trashedOpen, setTrashedOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [appliedRange, setAppliedRange] = useState<{ from: string; to: string } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["purchase-bills"],
    queryFn: () => apiFetch<{ data: PurchaseBill[] }>("/acc-vendors/purchase-bills?per_page=100"),
  });

  const { data: trashedData, isLoading: trashedLoading } = useQuery({
    queryKey: ["purchase-bills-trashed"],
    queryFn: () => apiFetch<{ data: PurchaseBill[] }>("/acc-vendors/purchase-bills/trashed"),
    enabled: trashedOpen,
  });

  const restoreMutation = useMutation({
    mutationFn: (bill: PurchaseBill) =>
      apiFetch(`/acc-vendors/${bill.vendor!.ulid}/transactions/${bill.ulid}/restore`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-bills"] });
      queryClient.invalidateQueries({ queryKey: ["purchase-bills-trashed"] });
      toast.success("Bill restored", "The purchase bill has been restored.");
    },
    onError: (err: any) => toast.error("Failed to restore bill", err?.message ?? "Something went wrong."),
  });

  const bills = data?.data ?? [];
  const filteredBills = bills.filter((b) => {
    const matchesSearch =
      (b.voucher_no ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (b.vendor?.name ?? "").toLowerCase().includes(search.toLowerCase());
    const matchesRange =
      !appliedRange || ((!appliedRange.from || b.date >= appliedRange.from) && (!appliedRange.to || b.date <= appliedRange.to));
    return matchesSearch && matchesRange;
  });
  const selectedBill = bills.find((b) => b.ulid === selectedUlid) ?? filteredBills[0] ?? null;

  return (
    <div className="p-6 flex flex-col gap-6 h-full">
      <div>
        <h2 className="text-h3 font-bold text-text-default">Purchase</h2>
        <p className="text-sm text-text-muted mt-0.5">All purchase bills recorded across vendors.</p>
      </div>

      <div className="flex gap-6 flex-1 min-h-0">
        {/* Sidebar: bill list */}
        <div className="w-80 shrink-0 flex flex-col h-full">
          <div className="flex items-center pb-3 shrink-0">
            <div className="relative flex-1">
              <Search className="absolute left-3 inset-y-0 my-auto h-3.5 w-3.5 text-text-muted pointer-events-none" />
              <input
                type="text"
                placeholder="Search bill no or vendor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-sm border border-slate-400 focus:outline-none focus:border-slate-600"
              />
            </div>
            <Link
              href="/admin/accounts/goods-purchased"
              className="flex items-center gap-1.5 h-9 bg-black px-3 text-h4 font-semibold text-white hover:bg-black/80 transition-colors shrink-0 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Add
            </Link>
            <div className="relative" ref={headerMenuRef}>
              <button
                type="button"
                onClick={() => setHeaderMenuOpen((v) => !v)}
                title="More actions"
                className="flex items-center justify-center h-9 w-7 bg-black border-l border-slate-500 text-white hover:bg-black/80 transition-colors shrink-0 cursor-pointer"
              >
                <MoreVertical className="h-3.5 w-3.5" />
              </button>
              {headerMenuOpen && (
                <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-slate-200 shadow-md z-10">
                  <button
                    type="button"
                    onClick={() => { setHeaderMenuOpen(false); setTrashedOpen(true); }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-text-default hover:bg-slate-50 cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Recently Deleted
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setHeaderMenuOpen(false);
                      setDateFrom(appliedRange?.from ?? "");
                      setDateTo(appliedRange?.to ?? "");
                      setFilterOpen(true);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-text-default hover:bg-slate-50 cursor-pointer"
                  >
                    <FilterIcon className="h-3.5 w-3.5" /> Filter
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col flex-1 min-h-0 border border-slate-400 overflow-hidden">
            <div className="grid grid-cols-[145px_1fr_90px] bg-black shrink-0">
              <span className="px-3 py-2.5 text-xs font-semibold text-white uppercase tracking-wide">Date</span>
              <span className="px-3 py-2.5 text-xs font-semibold text-white uppercase tracking-wide">Bill No.</span>
              <span className="px-3 py-2.5 text-xs font-semibold text-white uppercase tracking-wide text-right">Amount</span>
            </div>

            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <p className="p-4 text-sm text-text-muted text-center">Loading...</p>
              ) : filteredBills.length === 0 ? (
                <p className="p-4 text-sm text-text-muted text-center">No purchase bills found.</p>
              ) : (
                filteredBills.map((bill) => {
                  const isSelected = selectedBill?.ulid === bill.ulid;
                  return (
                    <div
                      key={bill.ulid}
                      onClick={() => setSelectedUlid(bill.ulid)}
                      className={`border-b border-slate-400 cursor-pointer transition-colors ${isSelected ? "bg-slate-200 border-l-2 border-l-slate-700" : "hover:bg-slate-50"}`}
                    >
                      <div className="grid grid-cols-[145px_1fr_90px] items-center">
                        <span className={`px-3 py-2.5 text-sm truncate ${isSelected ? "font-semibold text-text-default" : "font-medium text-text-default"}`}>
                          {bill.date}
                        </span>
                        <span className={`px-3 py-2.5 text-sm truncate ${isSelected ? "font-semibold text-text-default" : "font-medium text-text-default"}`}>
                          {bill.voucher_no || "—"}
                        </span>
                        <span className="px-3 py-2.5 text-sm font-semibold text-right text-text-default">
                          {(bill.grand_total ?? 0).toLocaleString()}
                        </span>
                      </div>
                      <p className="px-3 pb-2.5 -mt-1 text-xs font-medium text-text-default truncate">
                        {bill.vendor?.name ?? "—"}
                      </p>
                    </div>
                  );
                })
              )}
            </div>

            {/* Summary footer — stays put while the bill list above scrolls */}
            <div className="border-t border-slate-400 bg-slate-50 shrink-0">
              <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-200">
                <span className="text-xs text-text-body">Total (excl. VAT)</span>
                <span className="text-xs font-semibold text-text-default">
                  {filteredBills.reduce((sum, b) => sum + (b.taxable_amount ?? 0), 0).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-200">
                <span className="text-xs text-text-body">VAT 13%</span>
                <span className="text-xs font-semibold text-text-default">
                  {filteredBills.reduce((sum, b) => sum + (b.vat_amount ?? 0), 0).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-xs font-bold text-text-default">Grand Total</span>
                <span className="text-xs font-bold text-text-default">
                  {filteredBills.reduce((sum, b) => sum + (b.grand_total ?? 0), 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Detail panel */}
        <div className="flex-1 min-w-0 flex flex-col gap-4 h-full min-h-0">
          {!selectedBill ? (
            <div className="flex-1 flex items-center justify-center text-sm text-text-muted border border-slate-300 bg-white">
              Select a bill to view its details.
            </div>
          ) : (
            <>
              {/* Bill info card */}
              <div className="bg-white px-5 py-4">
                <div className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 text-sm items-center">
                  <p className="text-text-default"><span className="text-text-muted">Name:</span> <span className="font-bold">{selectedBill.vendor?.name ?? "—"}</span></p>
                  <div className="relative justify-self-end" ref={menuRef}>
                    <button
                      type="button"
                      onClick={() => setMenuOpen((v) => !v)}
                      className="flex items-center justify-center h-8 w-6 border border-slate-300 text-text-muted hover:bg-slate-50 hover:text-text-default transition-colors cursor-pointer"
                    >
                      <MoreVertical className="h-3.5 w-3.5" />
                    </button>
                    {menuOpen && selectedBill.vendor && (
                      <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-slate-200 shadow-md z-10 text-left">
                        <Link
                          href={`/admin/accounts/goods-purchased?vendor=${selectedBill.vendor.ulid}&transaction=${selectedBill.ulid}`}
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 text-sm text-text-default hover:bg-slate-50 cursor-pointer"
                        >
                          <Pencil className="h-3.5 w-3.5" /> Edit
                        </Link>
                      </div>
                    )}
                  </div>

                  <p className="text-text-default"><span className="text-text-muted">Address:</span> <span className="font-semibold">{selectedBill.vendor?.address || "—"}</span></p>
                  <p className="text-text-default text-right"><span className="text-text-muted">Date:</span> <span className="font-semibold">{selectedBill.date}</span></p>

                  <p className="text-text-default"><span className="text-text-muted">VAT No.:</span> <span className="font-semibold">{selectedBill.vendor?.vat_no || "—"}</span></p>
                  <p className="text-text-default text-right"><span className="text-text-muted">Bill No.:</span> <span className="font-semibold">{selectedBill.voucher_no || "—"}</span></p>
                </div>
              </div>

              {/* Line items */}
              <div className="flex-1 min-h-0 border border-slate-300 bg-white flex flex-col overflow-auto">
                <div className="grid grid-cols-[50px_1fr_100px_120px_120px_100px_120px] bg-black">
                  <span className="px-3 py-2.5 text-xs font-semibold text-white uppercase tracking-wide border-r border-slate-700">S.N.</span>
                  <span className="px-3 py-2.5 text-xs font-semibold text-white uppercase tracking-wide border-r border-slate-700">Product</span>
                  <span className="px-3 py-2.5 text-xs font-semibold text-white uppercase tracking-wide text-right border-r border-slate-700">Qty</span>
                  <span className="px-3 py-2.5 text-xs font-semibold text-white uppercase tracking-wide text-right border-r border-slate-700">Rate</span>
                  <span className="px-3 py-2.5 text-xs font-semibold text-white uppercase tracking-wide text-right border-r border-slate-700">Amount</span>
                  <span className="px-3 py-2.5 text-xs font-semibold text-white uppercase tracking-wide text-right border-r border-slate-700">Discount</span>
                  <span className="px-3 py-2.5 text-xs font-semibold text-white uppercase tracking-wide text-right">Total</span>
                </div>
                {selectedBill.items.map((item, idx) => (
                  <div key={item.ulid} className="grid grid-cols-[50px_1fr_100px_120px_120px_100px_120px] border-b border-slate-300">
                    <span className="px-3 py-2 text-sm text-black border-r border-slate-300">{idx + 1}</span>
                    <span className="px-3 py-2 text-sm font-medium text-black truncate border-r border-slate-300">{item.product_name}</span>
                    <span className="px-3 py-2 text-sm text-black text-right border-r border-slate-300">{item.quantity}</span>
                    <span className="px-3 py-2 text-sm text-black text-right border-r border-slate-300">{item.rate.toLocaleString()}</span>
                    <span className="px-3 py-2 text-sm text-black text-right border-r border-slate-300">{item.amount.toLocaleString()}</span>
                    <span className="px-3 py-2 text-sm text-black text-right border-r border-slate-300">{item.discount.toLocaleString()}</span>
                    <span className="px-3 py-2 text-sm font-semibold text-black text-right">{item.total.toLocaleString()}</span>
                  </div>
                ))}
                {Array.from({ length: Math.max(0, 7 - selectedBill.items.length) }).map((_, i) => (
                  <div key={`empty-${i}`} className="grid grid-cols-[50px_1fr_100px_120px_120px_100px_120px] border-b border-slate-300">
                    <span className="px-3 py-2 text-sm text-black border-r border-slate-300">&nbsp;</span>
                    <span className="px-3 py-2 text-sm text-black border-r border-slate-300">&nbsp;</span>
                    <span className="px-3 py-2 text-sm text-black border-r border-slate-300">&nbsp;</span>
                    <span className="px-3 py-2 text-sm text-black border-r border-slate-300">&nbsp;</span>
                    <span className="px-3 py-2 text-sm text-black border-r border-slate-300">&nbsp;</span>
                    <span className="px-3 py-2 text-sm text-black border-r border-slate-300">&nbsp;</span>
                    <span className="px-3 py-2 text-sm text-black">&nbsp;</span>
                  </div>
                ))}

                {/* Totals breakdown */}
                <div className="grid grid-cols-[50px_1fr_100px_120px_120px_100px_120px] border-t border-slate-100 shrink-0">
                  <div className="col-span-2 px-4 py-3">
                    <p className="text-xs font-semibold text-text-default uppercase tracking-wide mb-0">Amount In Words</p>
                    <p className="text-sm text-text-body leading-tight">{numberToWords(selectedBill.grand_total ?? 0)} Only</p>
                  </div>

                  <div className="border-l border-slate-100 flex items-start">
                    <div className="flex items-center justify-between gap-2 px-3 py-1.5 w-full">
                      <span className="text-sm text-text-body">Total</span>
                      <span className="text-sm font-semibold text-text-default">
                        {selectedBill.items.reduce((sum, it) => sum + it.quantity, 0).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="border-l border-slate-100"></div>

                  <div className="col-span-3 border-l border-slate-100">
                    <div>
                      <div className="flex items-center justify-between px-4 py-1.5 border-b border-slate-100">
                        <span className="text-sm text-text-body">Total</span>
                        <span className="text-sm font-semibold text-text-default">
                          {selectedBill.items.reduce((sum, it) => sum + it.total, 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between px-4 py-1.5 border-b border-slate-100">
                        <span className="text-sm text-text-body">Discount ({selectedBill.discount_percent ?? 0}%)</span>
                        <span className="text-sm font-semibold text-text-default">{(selectedBill.discount_amount ?? 0).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between px-4 py-1.5 border-b border-slate-100">
                        <span className="text-sm text-text-body">Taxable Amount</span>
                        <span className="text-sm font-semibold text-text-default">{(selectedBill.taxable_amount ?? 0).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between px-4 py-1.5 border-b border-slate-100">
                        <span className="text-sm text-text-body">VAT 13%</span>
                        <span className="text-sm font-semibold text-text-default">{(selectedBill.vat_amount ?? 0).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between px-4 py-2 bg-slate-50">
                        <span className="text-sm font-bold text-text-default">Grand Total</span>
                        <span className="text-sm font-bold text-text-default">{(selectedBill.grand_total ?? 0).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <Modal
        open={trashedOpen}
        onClose={() => setTrashedOpen(false)}
        title="Recently Deleted Purchase Bills"
        description="Deleted purchase bills. Restoring brings the bill and its items back."
        initialWidth={480}
        initialHeight={420}
      >
        {trashedLoading && <p className="text-sm text-text-muted">Loading…</p>}
        {!trashedLoading && (trashedData?.data.length ?? 0) === 0 && (
          <p className="text-sm text-text-muted">No deleted purchase bills.</p>
        )}
        {!trashedLoading && (trashedData?.data.length ?? 0) > 0 && (
          <div className="space-y-2">
            {trashedData!.data.map((bill) => (
              <div key={bill.ulid} className="flex items-center justify-between border border-slate-200 px-3 py-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-text-default truncate">
                    {bill.date} · Bill #{bill.voucher_no || "—"}
                  </p>
                  <p className="text-xs text-text-muted truncate">{bill.vendor?.name ?? "—"} · {(bill.grand_total ?? 0).toLocaleString()}</p>
                </div>
                <button
                  type="button"
                  disabled={restoreMutation.isPending}
                  onClick={() => restoreMutation.mutate(bill)}
                  className="shrink-0 px-3 py-1.5 text-xs font-semibold text-text-default border border-slate-300 hover:bg-slate-50 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  Restore
                </button>
              </div>
            ))}
          </div>
        )}
      </Modal>

      <Modal
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        title="Filter Purchase Bills"
        description="Show only bills within a date range."
        initialWidth={480}
        initialHeight={360}
        submitLabel="Apply"
        onSubmit={() => {
          setAppliedRange(dateFrom || dateTo ? { from: dateFrom, to: dateTo } : null);
          setFilterOpen(false);
        }}
      >
        <div className="space-y-3">
          <div>
            <p className="text-xs font-semibold text-text-default uppercase tracking-wide mb-1">From</p>
            <BsDateInput value={dateFrom} onChange={setDateFrom} />
          </div>
          <div>
            <p className="text-xs font-semibold text-text-default uppercase tracking-wide mb-1">To</p>
            <BsDateInput value={dateTo} onChange={setDateTo} />
          </div>
          {appliedRange && (
            <button
              type="button"
              onClick={() => { setDateFrom(""); setDateTo(""); setAppliedRange(null); }}
              className="text-xs font-semibold text-text-muted hover:text-text-default underline cursor-pointer"
            >
              Clear filter
            </button>
          )}
        </div>
      </Modal>
    </div>
  );
}
