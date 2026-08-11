"use client";

import { useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

type Brand = {
  ulid: string;
  name: string;
  logo: string | null;
};

type ApiBrand = {
  ulid: string;
  name: string;
  thumbnail: string | null;
  is_active: boolean;
};

export default function BrandsShowcase() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);

  const { data } = useQuery({
    queryKey: ["brands"],
    queryFn: () => apiFetch<{ data: ApiBrand[] }>("/brands?per_page=50&is_active=true"),
  });

  const brands: Brand[] = (data?.data ?? [])
    .map((b) => ({ ulid: b.ulid, name: b.name, logo: b.thumbnail ?? null }));

  const loopedBrands = brands.length === 0 ? [] : [...brands, ...brands, ...brands];

  useEffect(() => {
    if (!scrollRef.current || brands.length === 0) return;
    const container = scrollRef.current;
    container.scrollLeft = container.scrollWidth / 3;
  }, [brands.length]);

  const handleInfiniteScroll = () => {
    if (!scrollRef.current || isScrollingRef.current) return;

    const container = scrollRef.current;
    const singleSetWidth = container.scrollWidth / 3;
    const maxScrollLeft = container.scrollWidth - container.clientWidth;

    if (container.scrollLeft >= maxScrollLeft - 5) {
      container.style.scrollBehavior = "auto";
      container.scrollLeft = singleSetWidth;
    } else if (container.scrollLeft <= 5) {
      container.style.scrollBehavior = "auto";
      container.scrollLeft = singleSetWidth;
    }
  };

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;

    const container = scrollRef.current;
    const scrollAmount = container.clientWidth * 0.8;

    isScrollingRef.current = true;
    container.style.scrollBehavior = "smooth";

    if (direction === "left") {
      container.scrollLeft -= scrollAmount;
    } else {
      container.scrollLeft += scrollAmount;
    }

    setTimeout(() => {
      isScrollingRef.current = false;
      handleInfiniteScroll();
    }, 600);
  };

  if (brands.length === 0) {
    return null;
  }

  return (
    <section className="relative mt-8 overflow-x-hidden border border-slate-300 bg-slate-100 py-6 px-4 md:px-8">
      <div className="mb-5 flex flex-col items-center text-center">
        <h2 className="text-2xl font-black  text-gray-900">Our Brands</h2>
        <p className="mt-1 text-sm text-gray-900">Trusted names build trusted journeys.</p>
      </div>

      <div className="group relative min-w-0 overflow-hidden">
        <button
          type="button"
          onClick={() => scroll("left")}
          className="absolute left-0 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 -translate-x-4 items-center justify-center rounded-full border border-slate-100 bg-white text-slate-600 shadow-lg cursor-pointer opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 hover:bg-[#0d3b66] hover:text-white"
          aria-label="Scroll brands left"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>

        <button
          type="button"
          onClick={() => scroll("right")}
          className="absolute right-0 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 translate-x-4 items-center justify-center rounded-full border border-slate-100 bg-white text-slate-600 shadow-lg cursor-pointer opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 hover:bg-[#0d3b66] hover:text-white"
          aria-label="Scroll brands right"
        >
          <ChevronRight className="h-6 w-6" />
        </button>

        <div
          ref={scrollRef}
          onScroll={handleInfiniteScroll}
          className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar"
        >
          {loopedBrands.map((brand, index) => (
            <Link
              key={`${brand.ulid}-${index}`}
              href={`/products?brand_ulid=${brand.ulid}`}
              className="flex h-[110px] w-[150px] shrink-0 flex-col items-center justify-center border border-slate-300 bg-white px-2 py-2 transition-shadow hover:shadow-md hover:border-[#0d3b66]"
            >
              <div className="relative h-[90px] w-[130px] flex items-center justify-center">
                {brand.logo ? (
                  <Image
                    src={brand.logo}
                    alt={brand.name}
                    fill
                    sizes="130px"
                    className="object-contain opacity-90 transition-opacity duration-300 hover:opacity-100"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-slate-100 text-slate-400 text-xs font-medium">
                    No Image
                  </div>
                )}
              </div>
              <p title={brand.name} className="mt-2 w-full line-clamp-1 text-center text-sm-custom font-semibold text-gray-700">
                {brand.name}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
