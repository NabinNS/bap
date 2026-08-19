"use client";

import { useState } from "react";
import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table/DataTable";
import { Plus, Search, MapPin, Phone, Receipt, CreditCard, X, ExternalLink, Download, Send } from "lucide-react";


type Account = {
  id: number;
  date: string;
  particular: string;
  type: string;
  voucher_no: string;
  debit: number | null;
  credit: number | null;
  balance: number;
};

export default function AdminAccounts() {
  const [sideSearch, setSideSearch] = useState("");

  const dummyAccounts = [
    { id: 1, name: "Alice Johnson", amount: 12500 },
    { id: 2, name: "Bob Martinez", amount: 8400 },
    { id: 3, name: "Carol White", amount: 23100 },
    { id: 4, name: "David Lee", amount: 5300 },
    { id: 5, name: "Emma Davis", amount: 17800 },
    { id: 6, name: "Frank Wilson", amount: 9200 },
    { id: 7, name: "Grace Kim", amount: 31400 },
    { id: 8, name: "Henry Brown", amount: 6700 },
  ];

  const filteredDummy = dummyAccounts.filter((a) =>
    a.name.toLowerCase().includes(sideSearch.toLowerCase())
  );

  const dummyLedger: Account[] = [
    { id: 1,  date: "2026-01-05", particular: "Opening Balance",    type: "Journal",  voucher_no: "JV-0001", debit: null,   credit: null,   balance: 0 },
    { id: 2,  date: "2026-01-10", particular: "Invoice #1042",       type: "Invoice",  voucher_no: "INV-1042", debit: 15000,  credit: null,   balance: 15000 },
    { id: 3,  date: "2026-01-15", particular: "Payment Received",    type: "Receipt",  voucher_no: "REC-0021", debit: null,   credit: 8000,   balance: 7000 },
    { id: 4,  date: "2026-01-22", particular: "Invoice #1058",       type: "Invoice",  voucher_no: "INV-1058", debit: 9500,   credit: null,   balance: 16500 },
    { id: 5,  date: "2026-02-03", particular: "Partial Payment",     type: "Receipt",  voucher_no: "REC-0034", debit: null,   credit: 5000,   balance: 11500 },
    { id: 6,  date: "2026-02-14", particular: "Invoice #1073",       type: "Invoice",  voucher_no: "INV-1073", debit: 7200,   credit: null,   balance: 18700 },
    { id: 7,  date: "2026-02-28", particular: "Credit Note",         type: "Credit",   voucher_no: "CN-0008",  debit: null,   credit: 1200,   balance: 17500 },
    { id: 8,  date: "2026-03-07", particular: "Invoice #1089",       type: "Invoice",  voucher_no: "INV-1089", debit: 11000,  credit: null,   balance: 28500 },
    { id: 9,  date: "2026-03-20", particular: "Full Payment",        type: "Receipt",  voucher_no: "REC-0051", debit: null,   credit: 28500,  balance: 0 },
    { id: 10, date: "2026-04-02", particular: "Invoice #1102",       type: "Invoice",  voucher_no: "INV-1102", debit: 6800,   credit: null,   balance: 6800 },
  ];

  const accounts = dummyLedger;
  const meta = null;

  const columns: ColumnDef<Account, unknown>[] = [
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) =>
        new Date(row.original.date).toLocaleDateString("en-US", {
          year: "numeric", month: "short", day: "numeric",
        }),
    },
    {
      accessorKey: "particular",
      header: "Particular",
      cell: ({ row }) => (
        <span className="text-sm text-text-default">{row.original.particular}</span>
      ),
    },
    {
      accessorKey: "voucher_no",
      header: "Voucher No",
      cell: ({ row }) => (
        <span className="font-mono text-xs text-text-muted">{row.original.voucher_no}</span>
      ),
    },
    {
      accessorKey: "debit",
      header: "Debit",
      cell: ({ row }) =>
        row.original.debit != null
          ? <span className="text-sm font-semibold text-red-600">{row.original.debit.toLocaleString()}</span>
          : <span className="text-text-muted">—</span>,
    },
    {
      accessorKey: "credit",
      header: "Credit",
      cell: ({ row }) =>
        row.original.credit != null
          ? <span className="text-sm font-semibold text-green-600">{row.original.credit.toLocaleString()}</span>
          : <span className="text-text-muted">—</span>,
    },
    {
      accessorKey: "balance",
      header: "Balance",
      cell: ({ row }) => (
        <span className="text-sm font-bold text-text-default">{row.original.balance.toLocaleString()}</span>
      ),
    },
  ];

  return (
    <div className="flex-1 min-w-0 flex flex-col p-6 gap-6 h-full">
      <nav className="flex items-center gap-1.5 text-sm text-text-muted">
        <Link href="/admin" className="hover:text-text-default transition-colors">Dashboard</Link>
        <span>/</span>
        <span className="text-text-default font-medium">Accounts</span>
      </nav>

   

{/* Two-column body */}
      <div className="flex gap-6 flex-1 min-h-0">
        {/* Side card */}
        <div className="w-80 shrink-0 flex flex-col h-full">
          {/* Search + button row */}
          <div className="flex items-center pb-3 shrink-0">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted" />
              <input
                type="text"
                placeholder="Search..."
                value={sideSearch}
                onChange={(e) => setSideSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-sm border border-slate-400 focus:outline-none focus:border-slate-600"
              />
            </div>
            <button className="flex items-center gap-1.5 bg-black px-3 py-2 text-h4 font-semibold text-white hover:bg-black/80 transition-colors shrink-0 cursor-pointer">
              <Plus className="h-4 w-4" />
              Add
            </button>
          </div>

          {/* Bordered section */}
          <div className="flex flex-col flex-1 min-h-0 border border-slate-400 overflow-hidden">
            {/* Table header */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-black shrink-0">
              <span className="text-xs font-semibold text-white uppercase tracking-wide">Name</span>
              <span className="text-xs font-semibold text-white uppercase tracking-wide">Amount</span>
            </div>

            {/* Card list */}
            <div className="flex-1 overflow-y-auto">
              {filteredDummy.length === 0 ? (
                <p className="p-4 text-sm text-text-muted text-center">No results.</p>
              ) : (
                filteredDummy.map((account) => (
                  <div key={account.id} className="flex items-center justify-between px-4 py-3.5 border-b border-slate-400">
                    <span className="text-sm font-medium text-text-default">{account.name}</span>
                    <span className="text-sm font-semibold text-text-default">
                      ${account.amount.toLocaleString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Table + detail card */}
        <div className="flex-1 min-w-0 flex flex-col gap-4">
          {/* Account detail card */}
          <div className="bg-white px-5 py-4 space-y-3">
            {/* Top row: name + buttons */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-lg font-bold text-text-default leading-tight">Alice Johnson</p>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <div className="flex items-center gap-1 text-text-body text-sm-custom">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span>123 Main St, Kathmandu</span>
                  </div>
                  <span className="text-slate-300">|</span>
                  <div className="flex items-center gap-1 text-text-body text-sm-custom">
                    <Phone className="h-3.5 w-3.5 shrink-0" />
                    <span>+977 9801234567</span>
                  </div>
                  <span className="text-slate-300">|</span>
                  <div className="flex items-center gap-1 text-text-body text-sm-custom">
                    <Receipt className="h-3.5 w-3.5 shrink-0" />
                    <span>VAT No: VAT-987654321</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center shrink-0">
                <button className="flex items-center gap-2 bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-black/80 transition-colors cursor-pointer">
                  <Plus className="h-4 w-4" />
                  Goods Purchased
                </button>
                <button className="flex items-center gap-2 border border-slate-300 px-4 py-2 text-sm font-semibold text-text-default hover:bg-slate-50 transition-colors cursor-pointer">
                  <CreditCard className="h-4 w-4" />
                  Amount Paid
                </button>
              </div>
            </div>

            {/* Stat tiles */}
            <div className="grid grid-cols-6 gap-4 pt-1 border-t border-slate-100">
              <div>
                <p className="text-sm-custom text-text-body">Outstanding</p>
                <p className="text-sm-custom font-bold text-red-600 mt-0.5">$4,200</p>
                <p className="text-sm-custom text-text-body mt-0.5">Due Amount</p>
              </div>
              <div>
                <p className="text-sm-custom text-text-body">Total Sales</p>
                <p className="text-sm-custom font-bold text-text-default mt-0.5">$48,500</p>
                <p className="text-sm-custom text-text-body mt-0.5">7 Invoices</p>
              </div>
              <div>
                <p className="text-sm-custom text-text-body">Total Paid</p>
                <p className="text-sm-custom font-bold text-green-600 mt-0.5">$44,300</p>
                <p className="text-sm-custom text-text-body mt-0.5">9 Payments</p>
              </div>
              <div>
                <p className="text-sm-custom text-text-body">Total Credit</p>
                <p className="text-sm-custom font-bold text-green-600 mt-0.5">$42,700</p>
                <p className="text-sm-custom text-text-body mt-0.5">4 Credit Notes</p>
              </div>
              <div>
                <p className="text-sm-custom text-text-body">Transactions</p>
                <p className="text-sm-custom font-bold text-text-default mt-0.5">16</p>
                <p className="text-sm-custom text-text-body mt-0.5">This Period</p>
              </div>
              <div>
                <p className="text-sm-custom text-text-body">Last Transaction</p>
                <p className="text-sm-custom font-bold text-text-default mt-0.5">Apr 2, 2026</p>
                <p className="text-sm-custom text-text-body mt-0.5">Invoice #1102</p>
              </div>
            </div>
          </div>

          {/* Table + invoice detail panel */}
          <div className="flex gap-4 flex-1 min-h-0">
            <div className="flex-1 min-w-0">
              <DataTable
                columns={columns}
                data={accounts}
                loading={false}
                searchColumn="name"
                searchPlaceholder="Search accounts..."
                meta={meta}
              />
            </div>

            {/* Invoice detail panel */}
            <div className="w-[350px] shrink-0 bg-white border border-slate-200 flex flex-col overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                <p className="text-sm-custom font-bold text-text-default">Invoice #1042</p>
                <button className="text-text-muted hover:text-text-default transition-colors cursor-pointer">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Badges */}
              <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-100">
                <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-600">INV-1042</span>
                <span className="text-xs font-semibold px-2 py-0.5 bg-orange-50 text-orange-600">Unpaid</span>
              </div>

              {/* Invoice Details */}
              <div className="px-4 py-3 border-b border-slate-100 space-y-2">
                <p className="text-xs font-semibold text-text-default flex items-center gap-1.5">
                  <Receipt className="h-3.5 w-3.5" /> Invoice Details
                </p>
                <div className="space-y-1.5">
                  {[
                    { label: "Date", value: "Jan 10, 2026" },
                    { label: "Due Date", value: "Jan 25, 2026" },
                    { label: "Customer", value: "Alice Johnson" },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between">
                      <span className="text-sm-custom text-text-body">{label}</span>
                      <span className="text-sm-custom text-text-default">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Amount Details */}
              <div className="px-4 py-3 border-b border-slate-100 space-y-2">
                <p className="text-xs font-semibold text-text-default flex items-center gap-1.5">
                  <CreditCard className="h-3.5 w-3.5" /> Amount Details
                </p>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm-custom text-text-body">Subtotal</span>
                    <span className="text-sm-custom text-text-default">Rs. 13,392</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm-custom text-text-body">VAT (13%)</span>
                    <span className="text-sm-custom text-text-default">Rs. 1,608</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm-custom text-text-body">Total Amount</span>
                    <span className="text-sm-custom font-bold text-red-600">Rs. 15,000</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm-custom text-text-body">Paid Amount</span>
                    <span className="text-sm-custom text-text-default">Rs. 0</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm-custom text-text-body">Due Amount</span>
                    <span className="text-sm-custom font-bold text-red-600">Rs. 15,000</span>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div className="px-4 py-3 border-b border-slate-100 space-y-2">
                <p className="text-xs font-semibold text-text-default flex items-center gap-1.5">
                  <Receipt className="h-3.5 w-3.5" /> Items (2)
                </p>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm-custom text-text-body">Exide Battery 60Ah</span>
                    <span className="text-sm-custom text-text-default">2 × Rs. 6,000</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm-custom text-text-body">Engine Oil 5W-30</span>
                    <span className="text-sm-custom text-text-default">2 × Rs. 1,500</span>
                  </div>
                </div>
                <button className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer">View all items</button>
              </div>

              {/* Actions */}
              <div className="px-4 py-3 space-y-2">
                <p className="text-xs font-semibold text-text-default">Actions</p>
                <button className="flex w-full items-center justify-center gap-2 border border-slate-200 px-3 py-2 text-sm-custom font-semibold text-text-default hover:bg-slate-50 transition-colors cursor-pointer">
                  <ExternalLink className="h-3.5 w-3.5" /> View Invoice
                </button>
                <button className="flex w-full items-center justify-center gap-2 bg-green-600 px-3 py-2 text-sm-custom font-semibold text-white hover:bg-green-700 transition-colors cursor-pointer">
                  <CreditCard className="h-3.5 w-3.5" /> Receive Payment
                </button>
                <button className="flex w-full items-center justify-center gap-2 border border-slate-200 px-3 py-2 text-sm-custom font-semibold text-text-default hover:bg-slate-50 transition-colors cursor-pointer">
                  <Download className="h-3.5 w-3.5" /> Download PDF
                </button>
                <button className="flex w-full items-center justify-center gap-2 border border-slate-200 px-3 py-2 text-sm-custom font-semibold text-text-default hover:bg-slate-50 transition-colors cursor-pointer">
                  <Send className="h-3.5 w-3.5" /> Send Invoice
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
