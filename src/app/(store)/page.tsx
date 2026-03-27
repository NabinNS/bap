import Link from "next/link";
import { ArrowRight, Zap, Award, ShieldCheck, Clock } from "lucide-react";
import HeroSlider from "../../components/hero/HeroSlider";
import InfoPanel from "@/components/hero/InfoPanel";
import ProductSlider from "@/components/products/ProductSlider";
import CategorySlider from "@/components/categories/CategorySlider";
import BrandsShowcase from "@/components/brands/BrandsShowcase";
import { featuredProducts, categories, brands } from "@/data/storeHome";

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
              <p className="text-gray-900 text-sm mt-1">
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
              <p className="text-gray-900 text-sm mt-1">
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


        <BrandsShowcase brands={brands} />
      </div>
    </div>
  );
}
