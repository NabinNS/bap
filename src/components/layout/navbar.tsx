import Link from "next/link";
import { ShoppingCart, Heart, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Navbar() {
  return (
    <nav className="w-full bg-primary sticky top-0 z-50">
      <div className="container flex items-center justify-between px-4 py-4">
        <Link
          href="/"
          className="flex items-center space-x-2 text-white text-2xl font-bold"
        >
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-primary font-bold">
            B
          </div>
          <span>BAP</span>
        </Link>

        <div className="mx-6 hidden md:flex flex-1 justify-center">
          <div className="relative">
            <input
              type="text"
              placeholder="Search products..."
              className="w-[550px] py-2 pl-10 pr-4 rounded-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Login Button */}
          <Link href="/login">
            <Button className="border border-white text-white bg-transparent hover:bg-white hover:text-primary">
              Login
            </Button>
          </Link>

          <Button className="relative bg-white text-primary hover:bg-gray-100">
            <Heart className="w-6 h-6" />
            <span className="absolute -top-1 -right-1 text-xs bg-red-500 text-white rounded-full px-1">
              2
            </span>
          </Button>

          <Button className="relative bg-white text-primary hover:bg-gray-100">
            <ShoppingCart className="w-6 h-6" />
            <span className="absolute -top-1 -right-1 text-xs bg-red-500 text-white rounded-full px-1">
              3
            </span>
          </Button>
        </div>
      </div>
    </nav>
  );
}
