"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Phone, Receipt, Search, Trash2, Plus, Save, ArrowLeft, ListOrdered } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { toast } from "@/lib/toast";
import { BsDateInput, getTodayBs } from "@/components/ui/form/BsDateInput";

type VendorOpeningBalance = {
  fiscal_year_id: number;
  opening_balance: string;
};

type Vendor = {
  ulid: string;
  name: string;
  address: string | null;
  phone: string | null;
  telephone: string | null;
  vat_no: string | null;
  opening_balances: VendorOpeningBalance[];
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
  particular: string;
  quantity: string;
  rate: string;
};

let nextKey = 1;

function emptyRow(): LineItem {
  return { key: nextKey++, particular: "", quantity: "", rate: "" };
}


function GoodsPurchasedContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const vendorParam = searchParams.get("vendor");

  const [sideSearch, setSideSearch] = useState("");
  const [selectedVendorUlid, setSelectedVendorUlid] = useState<string | null>(vendorParam);
  const [rows, setRows] = useState<LineItem[]>([emptyRow()]);
  const [billDate, setBillDate] = useState(getTodayBs);
  const [billNo, setBillNo] = useState("");

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

  function selectVendor(ulid: string) {
    setSelectedVendorUlid(ulid);
    router.replace(`/admin/accounts/goods-purchased?vendor=${ulid}`);
  }

  function updateRow(key: number, field: keyof Omit<LineItem, "key">, value: string) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, [field]: value } : r)));
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

  const totalAmount = rows.reduce((sum, r) => sum + rowAmount(r), 0);

  function handleSave() {
    toast.warning("Not wired up yet", "Recording goods purchased entries will be connected soon.");
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
                        {activeFiscalYearId && vendor.opening_balances?.find((ob) => ob.fiscal_year_id === activeFiscalYearId)
                          ? Number(vendor.opening_balances.find((ob) => ob.fiscal_year_id === activeFiscalYearId)!.opening_balance).toLocaleString()
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
                    placeholder="Bill no..."
                    className="w-full h-8 px-2 text-sm font-medium text-black border border-slate-300 focus:outline-none focus:border-slate-500 bg-white"
                  />
                  <BsDateInput value={billDate} onChange={setBillDate} />
                </div>
              </div>
            </div>

            {/* Line item table */}
            <div className="border border-slate-300 bg-white flex flex-col">
              <div className="grid grid-cols-[60px_1fr_140px_140px_140px_44px] bg-black">
                <span className="px-3 py-2.5 text-xs font-semibold text-white uppercase tracking-wide">SN</span>
                <span className="px-3 py-2.5 text-xs font-semibold text-white uppercase tracking-wide">Particular</span>
                <span className="px-3 py-2.5 text-xs font-semibold text-white uppercase tracking-wide">Quantity</span>
                <span className="px-3 py-2.5 text-xs font-semibold text-white uppercase tracking-wide">Rate</span>
                <span className="px-3 py-2.5 text-xs font-semibold text-white uppercase tracking-wide">Amount</span>
                <span></span>
              </div>

              {rows.map((row, idx) => (
                <div key={row.key} className="grid grid-cols-[60px_1fr_140px_140px_140px_44px] border-b border-slate-200 items-center">
                  <span className="px-3 py-2 text-sm font-medium text-black">{idx + 1}</span>
                  <div className="px-3 py-1.5">
                    <input
                      type="text"
                      value={row.particular}
                      onChange={(e) => updateRow(row.key, "particular", e.target.value)}
                      placeholder="Item name..."
                      className={inputCls}
                    />
                  </div>
                  <div className="px-3 py-1.5">
                    <input
                      type="number"
                      min="0"
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
                      value={row.rate}
                      onChange={(e) => updateRow(row.key, "rate", e.target.value)}
                      placeholder="0.00"
                      className={`${inputCls} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                    />
                  </div>
                  <span className="px-3 py-2 text-sm font-medium text-black">
                    {rowAmount(row) ? rowAmount(row).toLocaleString() : "—"}
                  </span>
                  <button
                    onClick={() => removeRow(row.key)}
                    disabled={rows.length === 1}
                    className="flex items-center justify-center h-full py-2 text-text-muted hover:text-red-600 disabled:opacity-30 disabled:hover:text-text-muted transition-colors cursor-pointer disabled:cursor-not-allowed"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}

              <div className="flex items-center justify-between px-3 py-2.5">
                <button
                  onClick={addRow}
                  className="flex items-center gap-1.5 text-sm font-semibold text-text-default hover:text-black transition-colors cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Row
                </button>
                <div className="flex items-center gap-3">
                  <span className="text-sm-custom text-text-body">Total:</span>
                  <span className="text-sm-custom font-bold text-text-default">{totalAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleSave}
                disabled={!selectedVendor}
                className="flex items-center gap-2 bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-black/80 disabled:opacity-40 disabled:hover:bg-black transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                <Save className="h-4 w-4" />
                Save Purchase
              </button>
            </div>
          </div>
        </div>
      </div>
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
