import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Zap, Award, ShieldCheck, Clock } from "lucide-react";
import HeroSlider from "../../components/hero/HeroSlider";
import InfoPanel from "@/components/hero/InfoPanel";
import ProductSlider from "@/components/products/ProductSlider";
import { Button } from "@/components/ui/button";

const featuredProducts = [
  {
    id: "1",
    name: "Ceramic Brake Pads Set",
    price: 45.99,
    originalPrice: 59.99,
    rating: 5,
    image: "https://images.unsplash.com/photo-1620055282005-acc946535d51?q=80&w=800&auto=format&fit=crop",
    category: "Brakes",
    isNew: true,
  },
  {
    id: "2",
    name: "High Performance Oil Filter",
    price: 12.50,
    rating: 4,
    image: "https://images.unsplash.com/photo-1629732047847-5047f551b89a?q=80&w=800&auto=format&fit=crop",
    category: "Filters",
  },
  {
    id: "3",
    name: "Iridium Spark Plugs (4 Pack)",
    price: 32.00,
    originalPrice: 40.00,
    rating: 5,
    image: "https://images.unsplash.com/photo-1606577924006-27d39b132ce0?q=80&w=800&auto=format&fit=crop",
    category: "Ignition",
  },
  {
    id: "4",
    name: "12V 70Ah Car Battery",
    price: 120.00,
    rating: 4,
    image: "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?q=80&w=800&auto=format&fit=crop",
    category: "Electrical",
  },
  {
    id: "1",
    name: "Ceramic Brake Pads Set",
    price: 45.99,
    originalPrice: 59.99,
    rating: 5,
    image: "https://images.unsplash.com/photo-1620055282005-acc946535d51?q=80&w=800&auto=format&fit=crop",
    category: "Brakes",
    isNew: true,
  },
  {
    id: "2",
    name: "High Performance Oil Filter",
    price: 12.50,
    rating: 4,
    image: "https://images.unsplash.com/photo-1629732047847-5047f551b89a?q=80&w=800&auto=format&fit=crop",
    category: "Filters",
  },
  {
    id: "3",
    name: "Iridium Spark Plugs (4 Pack)",
    price: 32.00,
    originalPrice: 40.00,
    rating: 5,
    image: "https://images.unsplash.com/photo-1606577924006-27d39b132ce0?q=80&w=800&auto=format&fit=crop",
    category: "Ignition",
  },
  {
    id: "4",
    name: "12V 70Ah Car Battery",
    price: 120.00,
    rating: 4,
    image: "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?q=80&w=800&auto=format&fit=crop",
    category: "Electrical",
  },
  {
    id: "1",
    name: "Ceramic Brake Pads Set",
    price: 45.99,
    originalPrice: 59.99,
    rating: 5,
    image: "https://images.unsplash.com/photo-1620055282005-acc946535d51?q=80&w=800&auto=format&fit=crop",
    category: "Brakes",
    isNew: true,
  },
  {
    id: "2",
    name: "High Performance Oil Filter",
    price: 12.50,
    rating: 4,
    image: "https://images.unsplash.com/photo-1629732047847-5047f551b89a?q=80&w=800&auto=format&fit=crop",
    category: "Filters",
  },
  {
    id: "3",
    name: "Iridium Spark Plugs (4 Pack)",
    price: 32.00,
    originalPrice: 40.00,
    rating: 5,
    image: "https://images.unsplash.com/photo-1606577924006-27d39b132ce0?q=80&w=800&auto=format&fit=crop",
    category: "Ignition",
  },
  {
    id: "4",
    name: "12V 70Ah Car Battery",
    price: 120.00,
    rating: 4,
    image: "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?q=80&w=800&auto=format&fit=crop",
    category: "Electrical",
  },
];

import CategorySlider from "@/components/categories/CategorySlider";

const categories = [
  {
    name: "Batteries",
    count: "250+ Items",
    image: "https://images.unsplash.com/photo-1599420186946-7b6fb4e297f0?auto=format&fit=crop&q=80&w=800",
    href: "/categories/batteries"
  },
  {
    name: "Lubricants & Oils",
    count: "450+ Items",
    image: "https://images.unsplash.com/photo-1615906655593-ad0386982a0f?auto=format&fit=crop&q=80&w=800",
    href: "/categories/lubricants"
  },
  {
    name: "Brake System",
    count: "800+ Items",
    image: "https://images.unsplash.com/photo-1625047509168-a7026f36de04?auto=format&fit=crop&q=80&w=800",
    href: "/categories/brakes"
  },
  {
    name: "Lights & Bulbs",
    count: "350+ Items",
    image: "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&q=80&w=800",
    href: "/categories/lights"
  },
  {
    name: "Cleaning & Care",
    count: "200+ Items",
    image: "https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&q=80&w=800",
    href: "/categories/cleaning"
  },
  {
    name: "Miscellaneous",
    count: "500+ Items",
    image: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&q=80&w=800",
    href: "/categories/miscellaneous"
  },
];

const brands = [
  {
    name: "BOSCH",
    logo: "https://images.unsplash.com/photo-1588173889591-f5716c263162?auto=format&fit=crop&q=80&w=400",
  },
  {
    name: "Brembo",
    logo: "https://images.unsplash.com/photo-1584526053134-1334216dd1ba?auto=format&fit=crop&q=80&w=400",
  },
  {
    name: "NGK",
    logo: "https://images.unsplash.com/photo-1597362925123-77861d3fbac7?auto=format&fit=crop&q=80&w=400",
  },
  {
    name: "MANN+HUMMEL",
    logo: "https://images.unsplash.com/photo-1563453392212-326f5e854473?auto=format&fit=crop&q=80&w=400",
  },
  {
    name: "DENSO",
    logo: "https://images.unsplash.com/photo-1523983388277-336a66bf9bcd?auto=format&fit=crop&q=80&w=400",
  },
];

export default function StoreHomePage() {
  return (
    <div className="min-h-screen bg-[#F5F7FA] py-2">
      <div className="px-4 md:px-8 lg:px-12">
        {/* Hero Section */}
        <section className="py-10">
          <div className="flex flex-col md:flex-row justify-between gap-4 w-full h-auto md:h-80">
            <div className="flex-[7] h-full overflow-hidden rounded-xl">
              <HeroSlider />
            </div>

            <div className="flex-[3] h-full">
              <InfoPanel />
            </div>
          </div>
        </section>

        {/* Featured Categories */}
        <section className="relative py-10 px-4 md:px-8  border border-slate-300 bg-slate-100">
          <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
            <div className="flex flex-col">
              <h2 className="text-2xl font-black text-gray-900 leading-tight">Shop by Category</h2>
              <p className="text-gray-500 text-sm mt-1">
                Find parts easily by browsing our most popular categories.
              </p>
            </div>
            <Link
              href="/categories"
              className="group flex items-center gap-3 bg-gray-900 text-white px-8 py-3 rounded-full text-sm font-bold transition-all hover:bg-[#0d3b66]"
            >
              View All Categories
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <CategorySlider categories={categories} />
        </section>


        {/* Featured Products Segment */}
        <section className="relative py-10 px-4 md:px-8 border border-slate-300 bg-slate-100">
          <div className="flex items-center justify-between mb-8 gap-4">
            <h2 className="text-2xl font-black text-gray-900 leading-tight">Featured Products</h2>
            <Link
              href="/products"
              className="group flex items-center gap-3 bg-gray-900 text-white px-8 py-3.5 rounded-full text-sm font-bold transition-all hover:bg-[#0d3b66]"
            >
              View All Products
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <ProductSlider products={featuredProducts} />
        </section>

        {/* Special Offer Banner */}
        <section className="py-10">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-700 to-indigo-900 text-white p-8 md:p-12">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
            <div className="relative z-10 max-w-2xl">
              <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4 inline-block">
                Limited Time Offer
              </span>
              <h2 className="text-3xl md:text-5xl font-black mb-4 leading-tight">
                Flash Sale: Up to 40% OFF <br />
                on Genuine Brake Systems!
              </h2>
              <p className="text-blue-100 mb-8 text-lg">
                Ensure your safety with premium quality parts from top brands.{" "}
                <br className="hidden md:block" />
                Offer valid until Feb 28th.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button size="lg" className="bg-white text-blue-900 hover:bg-gray-100 font-bold px-8">
                  Shop Sale Now
                </Button>
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 font-bold">
                  Learn More
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Newsletter Section */}
        <section className="py-10">
          <div className="relative overflow-hidden bg-gray-900 rounded-3xl p-8 md:p-16 text-center text-white">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900/30 to-transparent"></div>
            <div className="relative z-10 max-w-2xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">Never Miss a Genuine Deal</h2>
              <p className="text-gray-400 mb-8">
                Subscribe to get the latest product updates, car maintenance tips, and special discounts delivered to your inbox.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  placeholder="Enter your email address"
                  className="flex-1 bg-white/10 border border-white/20 rounded-lg px-6 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
                <Button size="lg" className="bg-blue-700 hover:bg-blue-600 font-bold px-8">
                  Subscribe
                </Button>
              </div>
              <p className="text-[10px] text-gray-500 mt-4 italic">We respect your privacy. Unsubscribe at any time.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
