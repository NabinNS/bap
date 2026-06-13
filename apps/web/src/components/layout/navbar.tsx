import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NavbarSearchInput, NavbarSearchProvider } from "@/components/layout/NavbarProductSearch";

export default function Navbar() {
  return (
    <NavbarSearchProvider>
      <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-primary">
        <div className="mx-auto flex w-full max-w-[1700px] items-center gap-4 px-4 py-3 md:gap-6 md:px-8 md:py-4 lg:px-12">
          <Link
            href="/"
            replace
            className="flex shrink-0 items-center gap-2 text-2xl font-bold text-white"
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
                className="rounded-full border-white/90 bg-transparent text-white hover:bg-white hover:text-primary"
              >
                Login
              </Button>
            </Link>

            <Button
              type="button"
              className="relative rounded-full bg-white text-primary shadow-sm hover:bg-gray-100"
              aria-label="Shopping cart, 3 items"
            >
              <ShoppingCart className="h-6 w-6" />
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                3
              </span>
            </Button>
          </div>
        </div>

        <div className="mx-auto w-full max-w-[1700px] px-4 pb-3 md:hidden md:px-8 lg:px-12">
          <NavbarSearchInput className="w-full" />
        </div>
      </nav>
    </NavbarSearchProvider>
  );
}
