"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Users,
  BarChart2,
  Settings,
  LogOut,
  ChevronLeft,
  Tag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/features/auth/AuthProvider";

const navItems = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Products", href: "/admin/products", icon: Package },
  { label: "Categories", href: "/admin/categories", icon: Tag },
  { label: "Orders", href: "/admin/orders", icon: ShoppingBag },
  { label: "Customers", href: "/admin/customers", icon: Users },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart2 },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

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
          {navItems.map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 text-h4 font-semibold transition-all",
                collapsed && "justify-center px-0",
                pathname === href
                  ? "border-l-2 border-white bg-white/15 text-white"
                  : "border-l-2 border-transparent text-white/80 hover:bg-white/15 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && label}
            </Link>
          ))}
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

        {/* Toggle Button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="absolute -right-2 top-[20px] z-20 flex h-10 w-8 items-center justify-center  hover:text-white transition-colors duration-200 cursor-pointer"
        >
          <ChevronLeft className={cn("h-6 w-6 transition-transform duration-300", collapsed && "rotate-180")} />
        </button>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden relative">
        <header className="flex items-center gap-4 bg-white border-b border-slate-200 px-6 py-4 shrink-0">
          <span className="text-sm font-bold text-text-default">Best Auto Parts — Admin</span>
          <div className="ml-auto h-8 w-8 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">
            A
          </div>
        </header>
        <main className="flex-1 overflow-y-auto h-full">{children}</main>
      </div>
    </div>
  );
}
