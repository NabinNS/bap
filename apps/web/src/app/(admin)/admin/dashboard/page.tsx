"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  TrendingUp,
  TrendingDown,
  Boxes,
  AlertTriangle,
  Receipt,
  ShoppingCart,
  Trophy,
  PieChart,
  Wallet,
  Clock,
} from "lucide-react";
import { toBS } from "@zener/nepali-datepicker-react";
import { apiFetch } from "@/lib/api";
import { useViewingFiscalYear } from "@/features/fiscal-year/ViewingFiscalYearProvider";

type RangePreset = "fy" | "7" | "30" | "90";

const RANGE_PRESETS: { value: RangePreset; label: string }[] = [
  { value: "fy", label: "This Fiscal Year" },
  { value: "7", label: "Last 7 Days" },
  { value: "30", label: "Last 30 Days" },
  { value: "90", label: "Last 90 Days" },
];

function bsDateFromAd(adDate: Date): string {
  const adStr = `${adDate.getFullYear()}-${String(adDate.getMonth() + 1).padStart(2, "0")}-${String(adDate.getDate()).padStart(2, "0")}`;
  const bs = toBS(adStr);
  return `${bs.year}-${String(bs.month + 1).padStart(2, "0")}-${String(bs.date).padStart(2, "0")}`;
}

function dateRangeForPreset(preset: RangePreset): { from: string | null; to: string | null } {
  if (preset === "fy") return { from: null, to: null };

  const days = Number(preset);
  const today = new Date();
  const from = new Date(today);
  from.setDate(from.getDate() - (days - 1));

  return { from: bsDateFromAd(from), to: bsDateFromAd(today) };
}

type PartyLite = { ulid: string; name: string; address: string | null; vat_no: string | null };

type Bill = {
  ulid: string;
  date: string;
  particular: string;
  grand_total: number | null;
  customer?: PartyLite;
  vendor?: PartyLite;
};

type LowStockProduct = {
  ulid: string;
  name: string;
  sku: string | null;
  stock: number;
  low_stock_quantity: number | null;
};

type TopProduct = { ulid: string; name: string; sku: string | null; units_sold: number; revenue: number };
type TopCustomer = { ulid: string; name: string; bill_count: number; revenue: number };
type AgingBucket = { label: string; amount: number };

type MonthlyTrendPoint = { month: string; revenue: number; cost: number };

type DashboardSummary = {
  fiscal_year_id: number | null;
  counts: { vendors: number; customers: number; products: number; purchase_orders: number };
  receivable: number;
  payable: number;
  stock_value: number;
  low_stock_count: number;
  revenue: number;
  cost_of_goods_sold: number;
  profit: number;
  purchases: number;
  monthly_trend: MonthlyTrendPoint[];
  recent_sales_bills: Bill[];
  recent_purchase_bills: Bill[];
  low_stock_products: LowStockProduct[];
  top_products: TopProduct[];
  top_customers: TopCustomer[];
  receivable_aging: AgingBucket[];
  payable_aging: AgingBucket[];
};

function rs(amount: number): string {
  const rounded = Math.round(amount);
  return `Rs ${rounded.toLocaleString()}`;
}

function PanelIcon({ icon: Icon, color }: { icon: React.ComponentType<{ className?: string }>; color: string }) {
  return (
    <span className={`inline-flex h-6 w-6 items-center justify-center rounded-md ${color}`}>
      <Icon className="h-3.5 w-3.5" />
    </span>
  );
}

function Panel({
  title,
  subtitle,
  icon,
  iconColor,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
  iconColor?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="h-full rounded-xl bg-white border border-slate-200/70 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {icon ? <PanelIcon icon={icon} color={iconColor ?? "bg-black text-white"} /> : null}
          <div>
            <h3 className="text-[13px] font-semibold text-slate-700">{title}</h3>
            {subtitle ? <p className="text-xs text-text-muted">{subtitle}</p> : null}
          </div>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function ViewAllLink({ href }: { href: string }) {
  return (
    <Link href={href} className="text-xs font-semibold text-primary hover:underline">
      View all
    </Link>
  );
}

function Sparkline({ points, colorClass }: { points: number[]; colorClass: string }) {
  if (points.length < 2) return null;

  const width = 100;
  const height = 32;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  const stepX = width / (points.length - 1);
  const d = points
    .map((v, i) => `${i === 0 ? "M" : "L"} ${(i * stepX).toFixed(1)} ${(height - ((v - min) / range) * height).toFixed(1)}`)
    .join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-8 w-20 shrink-0" preserveAspectRatio="none">
      <path d={d} fill="none" className={colorClass} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function HeroStat({
  label,
  value,
  icon: Icon,
  color,
  badge,
  deltaPercent,
  sparklineData,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  color: "emerald" | "blue" | "orange" | "purple";
  badge?: string;
  deltaPercent?: number | null;
  sparklineData?: number[];
}) {
  const colorClasses: Record<string, { iconBg: string; icon: string; stroke: string }> = {
    emerald: { iconBg: "bg-black", icon: "text-white", stroke: "stroke-black" },
    blue: { iconBg: "bg-black", icon: "text-white", stroke: "stroke-black" },
    orange: { iconBg: "bg-black", icon: "text-white", stroke: "stroke-black" },
    purple: { iconBg: "bg-black", icon: "text-white", stroke: "stroke-black" },
  };
  const c = colorClasses[color];

  const hasDelta = deltaPercent !== undefined && deltaPercent !== null && Number.isFinite(deltaPercent);
  const deltaUp = hasDelta && deltaPercent! >= 0;

  return (
    <div className="rounded-xl bg-white border border-slate-200/70 p-5">
      <div className="flex items-center justify-between">
        <span className={`shrink-0 rounded-lg p-2 ${c.iconBg}`}>
          <Icon className={`h-4 w-4 ${c.icon}`} />
        </span>
        {sparklineData && sparklineData.length >= 2 ? (
          <Sparkline points={sparklineData} colorClass={c.stroke} />
        ) : null}
      </div>
      <p className="mt-3 text-xs font-medium text-text-muted">{label}</p>
      <p className="mt-0.5 text-xl font-bold text-slate-900 tracking-tight leading-tight">{value}</p>
      <div className="mt-1.5 flex items-center gap-1.5">
        {hasDelta ? (
          <span
            className={`inline-flex items-center gap-0.5 text-xs font-semibold ${
              deltaUp ? "text-black" : "text-red-700"
            }`}
            title="vs. previous month"
          >
            {deltaUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {deltaUp ? "+" : ""}
            {Math.round(deltaPercent!)}%
          </span>
        ) : null}
        <span className="text-xs text-text-muted">{badge ?? "vs. last month"}</span>
      </div>
    </div>
  );
}

function BillTable({ bills, partyLabel, partyHeader }: { bills: Bill[]; partyLabel: string; partyHeader: string }) {
  if (bills.length === 0) {
    return <p className="text-sm text-text-subtle">No {partyLabel.toLowerCase()} bills yet.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[11px] font-semibold uppercase tracking-wide text-text-muted">
            <th className="pb-2 font-semibold">{partyHeader}</th>
            <th className="pb-2 font-semibold">Date</th>
            <th className="pb-2 font-semibold text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {bills.map((bill) => {
            const party = bill.customer ?? bill.vendor;
            return (
              <tr key={bill.ulid} className="border-t border-slate-100 hover:bg-slate-50/60">
                <td className="py-2.5 font-semibold text-slate-700 truncate max-w-[160px]">{party?.name ?? "—"}</td>
                <td className="py-2.5 text-text-muted">{bill.date}</td>
                <td className="py-2.5 text-right font-bold text-slate-900 whitespace-nowrap">
                  {bill.grand_total != null ? rs(bill.grand_total) : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

type RankedItem = { ulid: string; name: string; meta: string; value: string; rankIcon?: React.ReactNode };

function RankedTable({ items, valueHeader }: { items: RankedItem[]; valueHeader: string }) {
  if (items.length === 0) {
    return <p className="text-sm text-text-subtle">No data recorded yet.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[11px] font-semibold uppercase tracking-wide text-text-muted">
            <th className="pb-1.5 font-semibold w-6">#</th>
            <th className="pb-1.5 font-semibold">Name</th>
            <th className="pb-1.5 font-semibold text-right">{valueHeader}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={item.ulid} className="border-t border-slate-100 hover:bg-slate-50/60">
              <td className="py-1.5 text-text-muted">{item.rankIcon ?? i + 1}</td>
              <td className="py-1.5 min-w-0">
                <p className="font-semibold text-slate-700 truncate leading-tight">{item.name}</p>
                <p className="text-xs text-text-muted leading-tight">{item.meta}</p>
              </td>
              <td className="py-1.5 text-right font-bold text-slate-900 whitespace-nowrap">{item.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MonthlyOverviewDonut({
  profit,
  sales,
  purchase,
  stockValue,
}: {
  profit: number;
  sales: number;
  purchase: number;
  stockValue: number;
}) {
  const safeProfit = Math.max(0, profit);
  const total = Math.max(1, safeProfit + sales + purchase + stockValue);

  const segments = [
    { label: "Profit", value: safeProfit, colorClass: "stroke-emerald-800", dotClass: "bg-emerald-800" },
    { label: "Sales", value: sales, colorClass: "stroke-slate-500", dotClass: "bg-slate-500" },
    { label: "Purchase", value: purchase, colorClass: "stroke-red-700", dotClass: "bg-red-700" },
    { label: "Stock Value", value: stockValue, colorClass: "stroke-slate-200", dotClass: "bg-slate-200" },
  ];

  const size = 160;
  const strokeWidth = 18;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let offsetAccum = 0;

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" className="text-slate-100" strokeWidth={strokeWidth} />
          {segments.map((seg) => {
            const fraction = seg.value / total;
            const dash = Math.max(0, fraction * circumference - (fraction > 0 ? 2 : 0));
            const dashArray = `${dash} ${circumference - dash}`;
            const el = (
              <circle
                key={seg.label}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                className={seg.colorClass}
                strokeWidth={strokeWidth}
                strokeDasharray={dashArray}
                strokeDashoffset={-offsetAccum}
                strokeLinecap="round"
              />
            );
            offsetAccum += fraction * circumference;
            return el;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-lg font-bold text-slate-900">{rs(total)}</p>
          <p className="text-xs text-text-muted">Total</p>
        </div>
      </div>
      <div className="w-full space-y-2.5">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center justify-between text-sm">
            <span className="inline-flex items-center gap-2 text-text-muted">
              <span className={`h-2.5 w-2.5 rounded-full ${seg.dotClass}`} />
              {seg.label}
            </span>
            <span className="font-semibold text-slate-900">{rs(seg.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function NetPositionBar({ receivable, payable }: { receivable: number; payable: number }) {
  const max = Math.max(1, receivable, payable);
  const net = receivable - payable;

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold text-text-muted uppercase tracking-wide">Receivable</span>
          <span className="text-sm font-bold text-emerald-800">{rs(receivable)}</span>
        </div>
        <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
          <div className="h-full rounded-full bg-emerald-800" style={{ width: `${Math.max(2, (receivable / max) * 100)}%` }} />
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold text-text-muted uppercase tracking-wide">Payable</span>
          <span className="text-sm font-bold text-red-700">{rs(payable)}</span>
        </div>
        <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
          <div className="h-full rounded-full bg-red-700" style={{ width: `${Math.max(2, (payable / max) * 100)}%` }} />
        </div>
      </div>
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
        <span className="text-xs font-semibold text-text-muted uppercase tracking-wide">Net Position</span>
        <span className={`text-sm font-extrabold ${net >= 0 ? "text-black" : "text-red-700"}`}>
          {net >= 0 ? "+" : ""}
          {rs(net)}
        </span>
      </div>
    </div>
  );
}

function AgingComparison({ receivable, payable }: { receivable: AgingBucket[]; payable: AgingBucket[] }) {
  if (receivable.every((b) => b.amount === 0) && payable.every((b) => b.amount === 0)) {
    return <p className="text-sm text-text-subtle">No billed activity yet to age.</p>;
  }

  const max = Math.max(1, ...receivable.map((b) => b.amount), ...payable.map((b) => b.amount));

  return (
    <div className="space-y-3">
      {receivable.map((bucket, i) => {
        const payableBucket = payable[i];
        return (
          <div key={bucket.label}>
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-1">{bucket.label}</p>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="h-2 flex-1 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full bg-emerald-800" style={{ width: `${Math.max(1, (bucket.amount / max) * 100)}%` }} />
                </div>
                <span className="text-xs font-semibold text-text-muted whitespace-nowrap w-24 text-right">{rs(bucket.amount)}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 flex-1 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-red-700"
                    style={{ width: `${Math.max(1, ((payableBucket?.amount ?? 0) / max) * 100)}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-text-muted whitespace-nowrap w-24 text-right">
                  {rs(payableBucket?.amount ?? 0)}
                </span>
              </div>
            </div>
          </div>
        );
      })}
      <div className="flex items-center gap-4 text-xs text-text-muted pt-1">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-800" /> Receivable
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-700" /> Payable
        </span>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { viewingFiscalYearId } = useViewingFiscalYear();
  const [rangePreset, setRangePreset] = useState<RangePreset>("fy");

  const { from, to } = useMemo(() => dateRangeForPreset(rangePreset), [rangePreset]);
  const rangeLabel = RANGE_PRESETS.find((p) => p.value === rangePreset)?.label ?? "This Fiscal Year";

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-summary", viewingFiscalYearId, from, to],
    queryFn: () => {
      const params = new URLSearchParams();
      if (viewingFiscalYearId) params.set("fiscal_year_id", String(viewingFiscalYearId));
      if (from && to) {
        params.set("from", from);
        params.set("to", to);
      }
      params.set("today_bs", bsDateFromAd(new Date()));
      return apiFetch<{ data: DashboardSummary }>(`/dashboard/summary?${params.toString()}`);
    },
    enabled: viewingFiscalYearId !== null,
  });

  const summary = data?.data;

  const margin = useMemo(() => {
    if (!summary || summary.revenue <= 0) return null;
    return Math.round((summary.profit / summary.revenue) * 100);
  }, [summary]);

  const sortedTrend = useMemo(
    () => [...(summary?.monthly_trend ?? [])].sort((a, b) => a.month.localeCompare(b.month)),
    [summary]
  );

  const momDeltas = useMemo(() => {
    const sorted = sortedTrend;
    if (sorted.length < 2) return { revenue: null, profit: null };

    const last = sorted[sorted.length - 1];
    const prev = sorted[sorted.length - 2];
    const lastProfit = last.revenue - last.cost;
    const prevProfit = prev.revenue - prev.cost;

    return {
      revenue: prev.revenue > 0 ? ((last.revenue - prev.revenue) / prev.revenue) * 100 : null,
      profit: prevProfit !== 0 ? ((lastProfit - prevProfit) / Math.abs(prevProfit)) * 100 : null,
    };
  }, [sortedTrend]);

  if (isLoading || !summary) {
    return (
      <div className="space-y-6 p-6">
        <h2 className="text-h3 font-bold text-text-default">Dashboard</h2>
        <p className="text-sm text-text-subtle">Loading dashboard…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-h3 font-bold text-text-default">Welcome back, Admin 👋</h2>
          <p className="text-sm text-text-muted">Here&apos;s what&apos;s happening with your business today.</p>
        </div>
        <div className="inline-flex rounded-xl bg-slate-100 p-1">
          {RANGE_PRESETS.map((preset) => (
            <button
              key={preset.value}
              type="button"
              onClick={() => setRangePreset(preset.value)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                rangePreset === preset.value
                  ? "bg-white text-primary shadow-sm"
                  : "text-text-subtle hover:text-text-body"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <HeroStat
          label="Profit"
          value={rs(summary.profit)}
          icon={summary.profit >= 0 ? TrendingUp : TrendingDown}
          color="emerald"
          badge={margin !== null ? `${margin}% margin` : rangeLabel}
          deltaPercent={momDeltas.profit}
          sparklineData={sortedTrend.map((d) => d.revenue - d.cost)}
        />
        <HeroStat
          label="Sales"
          value={rs(summary.revenue)}
          icon={ShoppingCart}
          color="blue"
          badge={rangeLabel}
          deltaPercent={momDeltas.revenue}
          sparklineData={sortedTrend.map((d) => d.revenue)}
        />
        <HeroStat label="Purchase" value={rs(summary.purchases)} icon={Receipt} color="orange" badge={rangeLabel} />
        <HeroStat label="Stock Value" value={rs(summary.stock_value)} icon={Boxes} color="purple" badge="WACC" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
        <Panel
          title="Receivables vs Payables"
          subtitle="This fiscal year"
          icon={PieChart}
          iconColor="bg-black text-white"
          action={
            <div className="text-right">
              <p className="text-[11px] text-text-muted">
                Total Receivable <span className="font-bold text-slate-700">{rs(summary.receivable)}</span>
              </p>
              <p className="text-[11px] text-text-muted">
                Total Payable <span className="font-bold text-slate-700">{rs(summary.payable)}</span>
              </p>
              <p className="text-[11px] text-text-muted">
                Net Position{" "}
                <span className={`font-bold ${summary.receivable - summary.payable >= 0 ? "text-black" : "text-red-700"}`}>
                  {rs(summary.receivable - summary.payable)}
                </span>
              </p>
            </div>
          }
        >
          <NetPositionBar receivable={summary.receivable} payable={summary.payable} />
        </Panel>
        <Panel title="Bills by Age" subtitle="This month" icon={Clock} iconColor="bg-black text-white">
          <AgingComparison receivable={summary.receivable_aging} payable={summary.payable_aging} />
        </Panel>
        <Panel title="Monthly Overview" icon={PieChart} iconColor="bg-black text-white">
          <MonthlyOverviewDonut
            profit={summary.profit}
            sales={summary.revenue}
            purchase={summary.purchases}
            stockValue={summary.stock_value}
          />
        </Panel>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        <Panel title="Recent Sales Bills" icon={Receipt} iconColor="bg-black text-white" action={<ViewAllLink href="/admin/customers/amount-received" />}>
          <BillTable bills={summary.recent_sales_bills} partyLabel="Sales" partyHeader="Customer" />
        </Panel>

        <Panel title="Recent Purchase Bills" icon={ShoppingCart} iconColor="bg-black text-white" action={<ViewAllLink href="/admin/accounts/amount-paid" />}>
          <BillTable bills={summary.recent_purchase_bills} partyLabel="Purchase" partyHeader="Vendor" />
        </Panel>

        <div className="space-y-4">
          <Panel title="Top Selling Products" icon={Trophy} iconColor="bg-black text-white" action={<ViewAllLink href="/admin/products" />}>
            <RankedTable
              valueHeader="Revenue"
              items={summary.top_products.map((product, i) => ({
                ulid: product.ulid,
                rankIcon: i === 0 ? <Trophy className="h-4 w-4 text-black" /> : undefined,
                name: product.name,
                meta: `${product.units_sold} units sold${product.sku ? ` · SKU ${product.sku}` : ""}`,
                value: rs(product.revenue),
              }))}
            />
          </Panel>

          <Panel title="Low Stock Alerts" icon={Wallet} iconColor="bg-black text-white" action={<ViewAllLink href="/admin/products" />}>
            {summary.low_stock_products.length === 0 ? (
              <p className="text-sm text-text-subtle">Nothing is low on stock.</p>
            ) : (
              summary.low_stock_products.map((product) => (
                <div key={product.ulid} className="flex items-center justify-between gap-3 py-1.5 border-b border-slate-50 last:border-0">
                  <div className="min-w-0 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-700 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-text-body truncate leading-tight">{product.name}</p>
                      {product.sku ? <p className="text-xs text-text-subtle leading-tight">SKU: {product.sku}</p> : null}
                    </div>
                  </div>
                  <p className="text-sm font-bold text-red-700 whitespace-nowrap">{product.stock} left</p>
                </div>
              ))
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
