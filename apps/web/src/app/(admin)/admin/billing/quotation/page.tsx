"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Pencil, MoreVertical, Plus, Trash2, Filter as FilterIcon } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { numberToWords } from "@/lib/numberToWords";
import { toast } from "@/lib/toast";
import { Modal } from "@/components/ui/Modal";
import { BsDateInput } from "@/components/ui/form/BsDateInput";
import { QuotationForm } from "./QuotationForm";

type QuotationItem = {
  ulid: string;
  product_ulid: string;
  product_name: string;
  quantity: number;
  rate: number;
  amount: number;
  discount: number;
  total: number;
};

type Quotation = {
  ulid: string;
  fiscal_year_id: number | null;
  customer: { ulid: string; name: string; address: string | null; vat_no: string | null } | null;
  date: string;
  voucher_no: string | null;
  discount_percent: number | null;
  discount_amount: number | null;
  taxable_amount: number | null;
  vat_amount: number | null;
  grand_total: number | null;
  items: QuotationItem[];
};

export default function QuotationPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [formCustomerUlid, setFormCustomerUlid] = useState<string | null>(null);
  const [formQuotationUlid, setFormQuotationUlid] = useState<string | null>(null);
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
    queryKey: ["quotations"],
    queryFn: () => apiFetch<{ data: Quotation[] }>("/quotations?per_page=100"),
  });

  const { data: trashedData, isLoading: trashedLoading } = useQuery({
    queryKey: ["quotations-trashed"],
    queryFn: () => apiFetch<{ data: Quotation[] }>("/quotations/trashed"),
    enabled: trashedOpen,
  });

  const restoreMutation = useMutation({
    mutationFn: (quotation: Quotation) =>
      apiFetch(`/acc-customers/${quotation.customer!.ulid}/quotations/${quotation.ulid}/restore`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      queryClient.invalidateQueries({ queryKey: ["quotations-trashed"] });
      toast.success("Quotation restored", "The quotation has been restored.");
    },
    onError: (err: any) => toast.error("Failed to restore quotation", err?.message ?? "Something went wrong."),
  });

  const quotations = data?.data ?? [];
  const filteredQuotations = quotations.filter((q) => {
    const matchesSearch =
      (q.voucher_no ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (q.customer?.name ?? "").toLowerCase().includes(search.toLowerCase());
    const matchesRange =
      !appliedRange || ((!appliedRange.from || q.date >= appliedRange.from) && (!appliedRange.to || q.date <= appliedRange.to));
    return matchesSearch && matchesRange;
  });
  const selectedQuotation = quotations.find((q) => q.ulid === selectedUlid) ?? filteredQuotations[0] ?? null;

  return (
    <div className="p-6 flex flex-col gap-6 h-full">
      <div>
        <h2 className="text-h3 font-bold text-text-default">Quotation/Estimate</h2>
        <p className="text-sm text-text-muted mt-0.5">All quotations recorded across customers.</p>
      </div>

      <div className="flex gap-6 flex-1 min-h-0">
        {/* Sidebar: quotation list */}
        <div className="w-80 shrink-0 flex flex-col h-full">
          <div className="flex items-center pb-3 shrink-0">
            <div className="relative flex-1">
              <Search className="absolute left-3 inset-y-0 my-auto h-3.5 w-3.5 text-text-muted pointer-events-none" />
              <input
                type="text"
                placeholder="Search quote no or customer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-sm border border-slate-400 focus:outline-none focus:border-slate-600"
              />
            </div>
            <button
              type="button"
              onClick={() => { setFormCustomerUlid(null); setFormQuotationUlid(null); setFormOpen(true); }}
              className="flex items-center gap-1.5 h-9 bg-black px-3 text-h4 font-semibold text-white hover:bg-black/80 transition-colors shrink-0 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Add
            </button>
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
            <div className="grid grid-cols-[120px_1fr_90px] bg-black shrink-0">
              <span className="px-3 py-2.5 text-xs font-semibold text-white uppercase tracking-wide">Date</span>
              <span className="px-3 py-2.5 text-xs font-semibold text-white uppercase tracking-wide whitespace-nowrap">Quote No.</span>
              <span className="px-3 py-2.5 text-xs font-semibold text-white uppercase tracking-wide text-right">Amount</span>
            </div>

            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <p className="p-4 text-sm text-text-muted text-center">Loading...</p>
              ) : filteredQuotations.length === 0 ? (
                <p className="p-4 text-sm text-text-muted text-center">No quotations found.</p>
              ) : (
                filteredQuotations.map((quotation) => {
                  const isSelected = selectedQuotation?.ulid === quotation.ulid;
                  return (
                    <div
                      key={quotation.ulid}
                      onClick={() => setSelectedUlid(quotation.ulid)}
                      className={`border-b border-slate-400 cursor-pointer transition-colors ${isSelected ? "bg-slate-200 border-l-2 border-l-slate-700" : "hover:bg-slate-50"}`}
                    >
                      <div className="grid grid-cols-[120px_1fr_90px] items-center">
                        <span className={`px-3 py-2.5 text-sm truncate ${isSelected ? "font-semibold text-text-default" : "font-medium text-text-default"}`}>
                          {quotation.date}
                        </span>
                        <span className={`px-3 py-2.5 text-sm truncate ${isSelected ? "font-semibold text-text-default" : "font-medium text-text-default"}`}>
                          {quotation.voucher_no || "—"}
                        </span>
                        <span className="px-3 py-2.5 text-sm font-semibold text-right text-text-default">
                          {(quotation.grand_total ?? 0).toLocaleString()}
                        </span>
                      </div>
                      <p className="px-3 pb-2.5 -mt-1 text-xs font-medium text-text-default truncate">
                        {quotation.customer?.name ?? "—"}
                      </p>
                    </div>
                  );
                })
              )}
            </div>

            {/* Summary footer — stays put while the quotation list above scrolls */}
            <div className="border-t border-slate-400 bg-slate-50 shrink-0">
              <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-200">
                <span className="text-xs text-text-body">Total (excl. VAT)</span>
                <span className="text-xs font-semibold text-text-default">
                  {filteredQuotations.reduce((sum, q) => sum + (q.taxable_amount ?? 0), 0).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-200">
                <span className="text-xs text-text-body">VAT 13%</span>
                <span className="text-xs font-semibold text-text-default">
                  {filteredQuotations.reduce((sum, q) => sum + (q.vat_amount ?? 0), 0).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-xs font-bold text-text-default">Grand Total</span>
                <span className="text-xs font-bold text-text-default">
                  {filteredQuotations.reduce((sum, q) => sum + (q.grand_total ?? 0), 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Detail panel */}
        <div className="flex-1 min-w-0 flex flex-col gap-4 h-full min-h-0">
          {formOpen ? (
            <QuotationForm
              initialCustomerUlid={formCustomerUlid}
              initialQuotationUlid={formQuotationUlid}
              onExit={() => {
                setFormOpen(false);
                setFormCustomerUlid(null);
                setFormQuotationUlid(null);
                queryClient.invalidateQueries({ queryKey: ["quotations"] });
              }}
            />
          ) : !selectedQuotation ? (
            <div className="flex-1 flex items-center justify-center text-sm text-text-muted border border-slate-300 bg-white">
              Select a quotation to view its details.
            </div>
          ) : (
            <>
              {/* Quotation info card */}
              <div className="bg-white px-5 py-4">
                <div className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 text-sm items-center">
                  <p className="text-text-default"><span className="text-text-muted">Name:</span> <span className="font-bold">{selectedQuotation.customer?.name ?? "—"}</span></p>
                  <div className="relative justify-self-end" ref={menuRef}>
                    <button
                      type="button"
                      onClick={() => setMenuOpen((v) => !v)}
                      className="flex items-center justify-center h-8 w-6 border border-slate-300 text-text-muted hover:bg-slate-50 hover:text-text-default transition-colors cursor-pointer"
                    >
                      <MoreVertical className="h-3.5 w-3.5" />
                    </button>
                    {menuOpen && selectedQuotation.customer && (
                      <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-slate-200 shadow-md z-10 text-left">
                        <button
                          type="button"
                          onClick={() => {
                            setMenuOpen(false);
                            setFormCustomerUlid(selectedQuotation.customer!.ulid);
                            setFormQuotationUlid(selectedQuotation.ulid);
                            setFormOpen(true);
                          }}
                          className="flex w-full items-center gap-2 px-3 py-2 text-sm text-text-default hover:bg-slate-50 cursor-pointer"
                        >
                          <Pencil className="h-3.5 w-3.5" /> Edit
                        </button>
                      </div>
                    )}
                  </div>

                  <p className="text-text-default"><span className="text-text-muted">Address:</span> <span className="font-semibold">{selectedQuotation.customer?.address || "—"}</span></p>
                  <p className="text-text-default text-right"><span className="text-text-muted">Date:</span> <span className="font-semibold">{selectedQuotation.date}</span></p>

                  <p className="text-text-default"><span className="text-text-muted">VAT No.:</span> <span className="font-semibold">{selectedQuotation.customer?.vat_no || "—"}</span></p>
                  <p className="text-text-default text-right"><span className="text-text-muted">Quote No.:</span> <span className="font-semibold">{selectedQuotation.voucher_no || "—"}</span></p>
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
                {selectedQuotation.items.map((item, idx) => (
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
                {Array.from({ length: Math.max(0, 7 - selectedQuotation.items.length) }).map((_, i) => (
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
                    <p className="text-sm text-text-body leading-tight">{numberToWords(selectedQuotation.grand_total ?? 0)} Only</p>
                  </div>

                  <div className="border-l border-slate-100 flex items-start">
                    <div className="flex items-center justify-between gap-2 px-3 py-1.5 w-full">
                      <span className="text-sm text-text-body">Total</span>
                      <span className="text-sm font-semibold text-text-default">
                        {selectedQuotation.items.reduce((sum, it) => sum + it.quantity, 0).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="border-l border-slate-100"></div>

                  <div className="col-span-3 border-l border-slate-100">
                    <div>
                      <div className="flex items-center justify-between px-4 py-1.5 border-b border-slate-100">
                        <span className="text-sm text-text-body">Total</span>
                        <span className="text-sm font-semibold text-text-default">
                          {selectedQuotation.items.reduce((sum, it) => sum + it.total, 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between px-4 py-1.5 border-b border-slate-100">
                        <span className="text-sm text-text-body">Discount ({selectedQuotation.discount_percent ?? 0}%)</span>
                        <span className="text-sm font-semibold text-text-default">{(selectedQuotation.discount_amount ?? 0).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between px-4 py-1.5 border-b border-slate-100">
                        <span className="text-sm text-text-body">Taxable Amount</span>
                        <span className="text-sm font-semibold text-text-default">{(selectedQuotation.taxable_amount ?? 0).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between px-4 py-1.5 border-b border-slate-100">
                        <span className="text-sm text-text-body">VAT 13%</span>
                        <span className="text-sm font-semibold text-text-default">{(selectedQuotation.vat_amount ?? 0).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between px-4 py-2 bg-slate-50">
                        <span className="text-sm font-bold text-text-default">Grand Total</span>
                        <span className="text-sm font-bold text-text-default">{(selectedQuotation.grand_total ?? 0).toLocaleString()}</span>
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
        title="Recently Deleted Quotations"
        description="Deleted quotations. Restoring brings the quotation and its items back."
        initialWidth={480}
        initialHeight={420}
      >
        {trashedLoading && <p className="text-sm text-text-muted">Loading…</p>}
        {!trashedLoading && (trashedData?.data.length ?? 0) === 0 && (
          <p className="text-sm text-text-muted">No deleted quotations.</p>
        )}
        {!trashedLoading && (trashedData?.data.length ?? 0) > 0 && (
          <div className="space-y-2">
            {trashedData!.data.map((quotation) => (
              <div key={quotation.ulid} className="flex items-center justify-between border border-slate-200 px-3 py-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-text-default truncate">
                    {quotation.date} · Quote #{quotation.voucher_no || "—"}
                  </p>
                  <p className="text-xs text-text-muted truncate">{quotation.customer?.name ?? "—"} · {(quotation.grand_total ?? 0).toLocaleString()}</p>
                </div>
                <button
                  type="button"
                  disabled={restoreMutation.isPending}
                  onClick={() => restoreMutation.mutate(quotation)}
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
        title="Filter Quotations"
        description="Show only quotations within a date range."
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
