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
    <div className="min-h-screen py-2">
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
        <section className="relative mt-8 py-10 px-4 md:px-8 border border-slate-300 bg-slate-100">
          <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
            <div className="flex flex-col mx-2">
              <h2 className="text-2xl font-black text-gray-900 leading-tight">Featured Products</h2>
              <p className="text-gray-500 text-sm mt-1">
                Find parts easily by browsing our most popular products.
              </p>
            </div>
            <Link
              href="/products"
              className="group flex items-center gap-3 bg-gray-900 text-white px-8 py-3 rounded-full text-sm font-bold transition-all hover:bg-[#0d3b66]"
            >
              View All Products
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <ProductSlider products={featuredProducts} />
        </section>


        {/* Our Brands */}
        <section className="-mx-4  my-8 md:-mx-8 lg:-mx-12 py-6 bg-[#ECEEF2]">
          <h2 className="text-center text-2xl md:text-3xl font-bold mb-8">
            <span className="inline-block border-b-2 border-gray-900 pb-1 px-4">
              Our Brands
            </span>
          </h2>
          <div className="overflow-hidden group">
            <div className="brand-marquee-track px-8">
              {[...brands, ...brands, ...brands].map((brand, index) => (
                <div
                  key={`${brand.name}-${index}`}
                  className="flex items-center justify-center"
                >
                  <div className="relative h-16 w-28 md:h-20 md:w-60">
                    <Image
                      src={brand.logo}
                      alt={brand.name}
                      fill
                      sizes="260px"
                      className="object-contain opacity-90 hover:opacity-100 transition-opacity duration-300"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
