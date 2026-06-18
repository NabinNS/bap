import Link from "next/link";
import { ArrowRight } from "lucide-react";
import HeroSlider from "@/features/home/components/HeroSlider";
import PromoCards from "@/features/home/components/PromoCards";
import ProductSlider from "@/features/products/components/ProductSlider";
import CategorySlider from "@/features/categories/components/CategorySlider";
import BrandsShowcase from "@/features/brands/components/BrandsShowcase";
import { featuredProducts, categories, brands } from "@/data/storeHome";

export default function StoreHomePage() {
  return (
    <div className="min-h-screen py-2">
      <div className="px-4 md:px-8 lg:px-12">
        {/* Hero Section */}
        <section className="py-6">
          <div className="flex flex-col lg:flex-row gap-4 w-full">
            {/* Left Side: Slider + Info Panel */}
            <div className="flex-1 min-w-0 flex flex-col gap-4">
              <div className="w-full h-64 md:h-[350px] lg:h-[380px] overflow-hidden rounded-xl relative">
                <HeroSlider />
              </div>
              <section className="relative py-4 px-6 border border-slate-300 bg-slate-100 rounded-xl">
                <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
                  <div className="flex flex-col">
                    <h2 className="text-2xl font-black text-gray-900 ">Shop by Category</h2>
                    <p className="text-gray-900 text-sm mt-1">
                      Find parts easily by browsing our most popular categories.
                    </p>
                  </div>
                  <Link
                    href="/categories"
                    className="group flex items-center gap-2 bg-gray-900 text-white px-5 py-2 rounded-full text-xs font-bold transition-all hover:bg-[#0d3b66]"
                  >
                    View All Categories
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
                <CategorySlider categories={categories} />
              </section>
            </div>

            {/* Right Side: Promo Cards */}
            <div className="w-full lg:w-[380px] xl:w-[440px] flex-shrink-0">
              <PromoCards />
            </div>
          </div>
        </section>


        {/* Featured Products Segment */}
        <section className="relative mt-8 pt-4 pb-0 px-4 md:px-8 border border-slate-300 bg-slate-100">
          <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
            <div className="flex flex-col mx-2">
              <h2 className="text-2xl font-black text-gray-900 ">Featured Products</h2>
              <p className="text-gray-900 text-sm mt-1">
                Find parts easily by browsing our most popular products.
              </p>
            </div>
            <Link
              href="/products"
              className="group flex items-center gap-2 bg-gray-900 text-white px-5 py-3 rounded-full text-xs font-bold transition-all hover:bg-[#0d3b66]"
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
