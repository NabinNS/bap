"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { AuthProvider } from "@/features/auth/AuthProvider";
import { ViewingFiscalYearProvider, useViewingFiscalYear } from "@/features/fiscal-year/ViewingFiscalYearProvider";
import { FiscalYearModal } from "@/app/(admin)/admin/accounts/_components/FiscalYearModal";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  BarChart2,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronDown,
  Tag,
  Bookmark,
  Images,
  BadgePercent,
  CircleUserRound,
  CalendarDays,
  Receipt,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/features/auth/AuthProvider";
import { apiFetch } from "@/lib/api";

type NavItem =
  | { label: string; href: string; icon: typeof LayoutDashboard; children?: undefined }
  | { label: string; icon: typeof LayoutDashboard; children: { label: string; href: string }[] };

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  {
    label: "Accounts",
    icon: CircleUserRound,
    children: [
      { label: "Vendor", href: "/admin/accounts" },
      { label: "Customer", href: "/admin/customers" },
    ],
  },
  { label: "Product/Stock", href: "/admin/products", icon: Package },
  {
    label: "Billing",
    icon: Receipt,
    children: [
      { label: "Purchase", href: "/admin/billing/purchase" },
      { label: "Sales", href: "/admin/billing/sales" },
      { label: "Quotation/Estimate", href: "/admin/billing/quotation" },
      { label: "Purchase Order", href: "/admin/billing/purchase-order" },
    ],
  },
  { label: "Sliders", href: "/admin/sliders", icon: Images },
  { label: "Offers", href: "/admin/offers", icon: BadgePercent },
  { label: "Categories", href: "/admin/categories", icon: Tag },
  { label: "Brands", href: "/admin/brands", icon: Bookmark },
  { label: "Orders", href: "/admin/orders", icon: ShoppingBag },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart2 },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const { data: settingsData } = useQuery({
    queryKey: ["settings"],
    queryFn: () => apiFetch<{ data: { fiscal_year_id: number | null; fiscal_year: { ulid: string; name: string } | null } }>("/settings"),
  });
  const activeFiscalYearId = settingsData?.data?.fiscal_year_id ?? null;

  return (
    <ViewingFiscalYearProvider activeFiscalYearId={activeFiscalYearId}>
      <AdminLayoutBody>{children}</AdminLayoutBody>
    </ViewingFiscalYearProvider>
  );
}

function AdminLayoutBody({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(
    () => navItems.find((item) => item.children?.some((c) => pathname.startsWith(c.href)))?.label ?? null
  );
  const [fiscalYearModalOpen, setFiscalYearModalOpen] = useState(false);
  const [fiscalYearDraft, setFiscalYearDraft] = useState("");

  const { viewingFiscalYearId, setViewingFiscalYearId } = useViewingFiscalYear();

  const { data: fiscalYearsData } = useQuery({
    queryKey: ["fiscal-years"],
    queryFn: () => apiFetch<{ data: { id: number; ulid: string; name: string; sort_order: number }[] }>("/fiscal-years"),
    staleTime: Infinity,
  });
  const fiscalYears = fiscalYearsData?.data ?? [];
  const viewingFiscalYear = fiscalYears.find((fy) => fy.id === viewingFiscalYearId) ?? null;

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  return (
    <div className="flex h-screen bg-[#EEF2F6] overflow-hidden">
      {/* Sidebar */}
      <aside
        className={cn(
          "flex flex-col bg-black text-white shrink-0 transition-all duration-300 relative z-20",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {/* Logo */}
        <div className={cn(
          "flex items-center gap-3 px-4 py-5 border-b border-white/10",
          collapsed && "justify-center"
        )}>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white font-bold text-primary text-lg shrink-0">
            B
          </div>
          {!collapsed && (
            <div>
              <p className="text-base font-bold leading-none">BAP</p>
              <p className="text-sm text-white/50 font-semibold mt-0.5">Admin Panel</p>
            </div>
          )}
        </div>

        <nav className="flex-1 py-4 space-y-1">
          {collapsed && (
            <button
              onClick={() => setCollapsed(false)}
              aria-label="Expand sidebar"
              title="Expand sidebar"
              className="flex w-full items-center justify-center px-0 py-2.5 border-l-2 border-transparent text-white/80 hover:bg-white/15 hover:text-white transition-all cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4 rotate-180" />
            </button>
          )}
          {navItems.map((item) => {
            const Icon = item.icon;
            if (!item.children) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 text-h4 font-semibold transition-all",
                    collapsed && "justify-center px-0",
                    pathname === item.href
                      ? "border-l-2 border-white bg-white/15 text-white"
                      : "border-l-2 border-transparent text-white/80 hover:bg-white/15 hover:text-white"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!collapsed && item.label}
                </Link>
              );
            }

            const isActiveGroup = item.children.some((c) => pathname.startsWith(c.href));
            const isOpen = collapsed ? isActiveGroup : openGroup === item.label;

            return (
              <div key={item.label}>
                <button
                  type="button"
                  onClick={() => setOpenGroup((g) => (g === item.label ? null : item.label))}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "flex w-full items-center gap-3 px-4 py-2.5 text-h4 font-semibold transition-all cursor-pointer",
                    collapsed && "justify-center px-0",
                    isActiveGroup
                      ? "border-l-2 border-white bg-white/15 text-white"
                      : "border-l-2 border-transparent text-white/80 hover:bg-white/15 hover:text-white"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left">{item.label}</span>
                      <ChevronDown className={cn("h-3.5 w-3.5 shrink-0 transition-transform", isOpen && "rotate-180")} />
                    </>
                  )}
                </button>
                {!collapsed && isOpen && (
                  <div className="space-y-1 pt-1">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={cn(
                          "flex items-center gap-3 pl-11 pr-4 py-2 text-sm font-semibold transition-all",
                          pathname === child.href || pathname.startsWith(child.href + "/")
                            ? "text-white bg-white/10"
                            : "text-white/70 hover:bg-white/10 hover:text-white"
                        )}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="py-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            title={collapsed ? "Logout" : undefined}
            className={cn(
              "flex w-full items-center gap-3 px-4 py-2.5 text-h4 font-semibold border-l-2 border-transparent text-white/80 hover:bg-white/15 hover:text-white transition-all",
              collapsed && "justify-center px-0"
            )}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && "Logout"}
          </button>
        </div>

        {/* Toggle Button — visible only when expanded */}
        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            aria-label="Collapse sidebar"
            className="absolute right-0 top-0 z-20 flex h-[76px] w-8 items-center justify-center hover:bg-white/15 transition-colors duration-200 cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden relative">
        <header className="flex items-center gap-4 bg-white border-b border-slate-200 px-6 py-4 shrink-0">
          <span className="text-sm font-bold text-text-default">Best Auto Parts — Admin</span>
          <button
            type="button"
            onClick={() => { setFiscalYearDraft(viewingFiscalYearId ? String(viewingFiscalYearId) : ""); setFiscalYearModalOpen(true); }}
            title="Change which fiscal year Accounts and Product/Stock show data for and record new entries into"
            className="ml-auto flex items-center gap-1.5 border border-slate-300 px-3 py-1.5 text-xs font-semibold text-text-default hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <CalendarDays className="h-3.5 w-3.5 text-text-muted" />
            {viewingFiscalYear?.name ?? "—"}
          </button>
          <div className="h-8 w-8 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">
            A
          </div>
        </header>
        <main className="flex-1 overflow-y-auto h-full">{children}</main>
      </div>

      <FiscalYearModal
        open={fiscalYearModalOpen}
        onClose={() => setFiscalYearModalOpen(false)}
        fiscalYears={fiscalYears}
        draft={fiscalYearDraft}
        onDraftChange={setFiscalYearDraft}
        description="Changes which fiscal year Accounts and Product/Stock show data for, and which year new entries get recorded into. This does not change the tenant's active fiscal year — set that in Settings."
        onApply={() => {
          if (!fiscalYearDraft) return;
          setViewingFiscalYearId(Number(fiscalYearDraft));
          setFiscalYearModalOpen(false);
        }}
      />
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </AuthProvider>
  );
}
