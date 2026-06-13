"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Brand = {
  name: string;
  logo: string;
};

export default function BrandsShowcase({ brands }: { brands: Brand[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isScrolling, setIsScrolling] = useState(false);

  const loopedBrands = brands.length === 0 ? [] : [...brands, ...brands, ...brands];

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

  if (brands.length === 0) {
    return null;
  }

  return (
    <section className="relative mt-8 overflow-x-hidden border border-slate-300 bg-slate-100 py-6 px-4 md:px-8">
      <div className="mb-5 flex flex-col items-center text-center">
        <h2 className="text-2xl font-black leading-tight text-gray-900">Our Brands</h2>
        <p className="mt-1 text-sm text-gray-900">Trusted names build trusted journeys.</p>
      </div>

      <div className="group relative min-w-0 overflow-hidden">
        <button
          type="button"
          onClick={() => scroll("left")}
          className="absolute left-1 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-slate-100 bg-white text-slate-600 shadow-lg transition-all duration-300 hover:bg-[#0d3b66] hover:text-white md:left-0 md:-translate-x-4 md:opacity-0 md:group-hover:translate-x-0 md:group-hover:opacity-100"
          aria-label="Scroll brands left"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>

        <button
          type="button"
          onClick={() => scroll("right")}
          className="absolute right-1 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-slate-100 bg-white text-slate-600 shadow-lg transition-all duration-300 hover:bg-[#0d3b66] hover:text-white md:right-0 md:translate-x-4 md:opacity-0 md:group-hover:translate-x-0 md:group-hover:opacity-100"
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
            <div
              key={`${brand.name}-${index}`}
              className="flex h-[110px] w-[150px] shrink-0 flex-col items-center justify-center border border-slate-300 bg-white px-2 py-2"
            >
              <div className="relative h-[90px] w-[130px]">
                <Image
                  src={brand.logo}
                  alt={brand.name}
                  fill
                  sizes="130px"
                  className="object-contain opacity-90 transition-opacity duration-300 hover:opacity-100"
                />
              </div>
              <p className="mt-2 w-full line-clamp-1 text-center text-[14px] font-semibold leading-tight text-gray-700">
                {brand.name}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
