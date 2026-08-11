"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import CategoryCard from "./CategoryCard";

type ApiCategory = {
  ulid: string;
  name: string;
  slug: string;
  thumbnail: string | null;
  is_active: boolean;
};

export default function CategorySlider() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data } = useQuery({
    queryKey: ["public-categories"],
    queryFn: () => apiFetch<{ data: ApiCategory[] }>("/categories?per_page=10&is_active=true"),
  });

  const categories = data?.data ?? [];

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const container = scrollRef.current;
      const scrollAmount = container.clientWidth * 0.8;
      container.scrollTo({
        left: direction === "left" ? container.scrollLeft - scrollAmount : container.scrollLeft + scrollAmount,
        behavior: "smooth",
      });
    }
  };

  if (categories.length === 0) return null;

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
        className="flex overflow-x-auto gap-4 pb-4 hide-scrollbar scroll-smooth"
      >
        {categories.map((category) => (
          <div key={category.ulid} className="w-[200px] flex-shrink-0">
            <CategoryCard
              name={category.name}
              image={category.thumbnail ?? undefined}
              href={`/products?category_ulid=${category.ulid}`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
