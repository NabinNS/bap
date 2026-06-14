import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NavbarSearchInput, NavbarSearchProvider } from "@/components/layout/NavbarProductSearch";
import { categories } from "@/data/storeHome";

export default function Navbar() {
  return (
    <NavbarSearchProvider>
      <nav className="sticky top-0 z-50 w-full bg-primary">
        {/* Main bar */}
        <div className="border-b border-white/10">
          <div className="mx-auto flex w-full max-w-[1700px] items-center gap-4 px-4 py-3 md:gap-6 md:px-8 md:py-4 lg:px-12">
            <Link
              href="/"
              replace
              className="flex shrink-0 items-center gap-2 text-2xl font-bold text-white"
              aria-label="BAP home"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white font-bold text-primary">
                B
              </div>
              <span>BAP</span>
            </Link>

            <div className="hidden min-w-0 flex-1 justify-center md:flex">
              <NavbarSearchInput className="w-full max-w-xl lg:max-w-2xl" />
            </div>

            <div className="flex shrink-0 items-center gap-2 sm:gap-3 md:gap-4">
              <Link href="/login">
                <Button
                  variant="outline"
                  className="cursor-pointer rounded-full border-white/40 bg-white/10 text-white backdrop-blur-sm hover:border-white/70 hover:bg-white/20 hover:text-white"
                >
                  Login
                </Button>
              </Link>

              <Button
                type="button"
                className="relative cursor-pointer rounded-full bg-gradient-to-br from-white/20 to-white/10 text-white shadow-sm backdrop-blur-sm hover:from-white/30 hover:to-white/20"
                aria-label="Shopping cart, 3 items"
              >
                <ShoppingCart className="h-6 w-6" />
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white tabular-nums">
                  3
                </span>
              </Button>
            </div>
          </div>

          {/* Mobile search */}
          <div className="mx-auto w-full max-w-[1700px] px-4 pb-3 md:hidden md:px-8 lg:px-12">
            <NavbarSearchInput className="w-full" />
          </div>
        </div>

        {/* Category bar */}
        <div className="overflow-x-auto scrollbar-none">
          <div className="flex items-stretch justify-center px-4 md:px-8 lg:px-12">
            {categories.map((cat) => (
              <Link
                key={cat.name}
                href={cat.href}
                className="shrink-0 whitespace-nowrap px-4 py-2.5 text-xs font-semibold text-white/90 transition-all hover:bg-white/15 hover:text-white"
              >
                {cat.name}
              </Link>
            ))}
            <span className="my-1.5 w-px bg-white/20" />
            <Link
              href="/products"
              className="shrink-0 whitespace-nowrap px-4 py-2.5 text-xs font-semibold text-white/90 transition-all hover:bg-white/15 hover:text-white"
            >
              All Products →
            </Link>
          </div>
        </div>
      </nav>
    </NavbarSearchProvider>
  );
}
