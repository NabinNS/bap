"use client";

import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import ProductCard from "./ProductCard";

type ApiProduct = {
  ulid: string;
  name: string;
  price: number;
  thumbnail: string | null;
  is_active: boolean;
  category: { ulid: string; name: string } | null;
};

export default function ProductSlider() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isScrolling, setIsScrolling] = useState(false);

  const { data } = useQuery({
    queryKey: ["public-products"],
    queryFn: () => apiFetch<{ data: ApiProduct[] }>("/products?per_page=20&is_active=true"),
  });

  const products = data?.data ?? [];
  const loopedProducts = products.length === 0 ? [] : [...products, ...products, ...products];

  const handleInfiniteScroll = () => {
    if (!scrollRef.current || isScrolling) return;
    const container = scrollRef.current;
    const singleSetWidth = container.scrollWidth / 3;
    if (container.scrollLeft >= singleSetWidth * 2) {
      container.style.scrollBehavior = "auto";
      container.scrollLeft = container.scrollLeft - singleSetWidth;
    } else if (container.scrollLeft <= 0) {
      container.style.scrollBehavior = "auto";
      container.scrollLeft = container.scrollLeft + singleSetWidth;
    }
  };

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    const scrollAmount = container.clientWidth * 0.8;
    setIsScrolling(true);
    container.style.scrollBehavior = "smooth";
    if (direction === "left") {
      container.scrollLeft -= scrollAmount;
    } else {
      container.scrollLeft += scrollAmount;
    }
    setTimeout(() => {
      setIsScrolling(false);
      handleInfiniteScroll();
    }, 600);
  };

  if (products.length === 0) return null;

  return (
    <div className="group relative">
      <button
        onClick={() => scroll("left")}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-20 w-10 h-10 rounded-full bg-white shadow-lg border border-slate-100 flex items-center justify-center text-slate-600 cursor-pointer opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 hover:bg-[#0d3b66] hover:text-white"
        aria-label="Scroll left"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      <button
        onClick={() => scroll("right")}
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-20 w-10 h-10 rounded-full bg-white shadow-lg border border-slate-100 flex items-center justify-center text-slate-600 cursor-pointer opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 hover:bg-[#0d3b66] hover:text-white"
        aria-label="Scroll right"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      <div
        ref={scrollRef}
        onScroll={handleInfiniteScroll}
        className="flex overflow-x-auto gap-4 pb-4 hide-scrollbar"
      >
        {loopedProducts.map((product, index) => (
          <div key={`${product.ulid}-${index}`} className="min-w-[220px] sm:min-w-[240px] flex-shrink-0">
            <ProductCard
              ulid={product.ulid}
              name={product.name}
              price={product.price}
              thumbnail={product.thumbnail}
              category={product.category?.name ?? null}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
