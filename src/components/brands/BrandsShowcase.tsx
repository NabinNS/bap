"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Brand = {
  name: string;
  logo: string;
};

const CARD_MIN_WIDTH = 96;
const CARD_GAP = 16;

export default function BrandsShowcase({ brands }: { brands: Brand[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [itemsPerPage, setItemsPerPage] = useState(1);
  const [page, setPage] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;

    const element = containerRef.current;
    const updateItemsPerPage = () => {
      const width = element.clientWidth;
      const fitCount = Math.max(1, Math.floor((width + CARD_GAP) / (CARD_MIN_WIDTH + CARD_GAP)));
      setItemsPerPage(fitCount);
    };

    updateItemsPerPage();
    const observer = new ResizeObserver(updateItemsPerPage);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const totalPages = Math.max(1, Math.ceil(brands.length / itemsPerPage));

  useEffect(() => {
    setPage((prev) => Math.min(prev, totalPages - 1));
  }, [totalPages]);

  const visibleBrands = useMemo(() => {
    const start = page * itemsPerPage;
    return brands.slice(start, start + itemsPerPage);
  }, [brands, itemsPerPage, page]);

  return (
    <section className="relative mt-8 py-6 px-4 md:px-8 border border-slate-300 bg-slate-100">
      <div className="flex flex-col items-center mb-5 text-center">
        <h2 className="text-2xl font-black text-gray-900 leading-tight">Our Brands</h2>
        <p className="text-gray-900 text-sm mt-1">Trusted names build trusted journeys.</p>
      </div>

      <div className="group relative">
        <button
          type="button"
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={page === 0 || totalPages === 1}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-20 w-10 h-10 rounded-full bg-white shadow-lg border border-slate-100 flex items-center justify-center text-slate-600 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 hover:bg-[#0d3b66] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Show previous brands"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <div ref={containerRef} className="min-w-0">
          <div className="flex items-center justify-center gap-3">
            {visibleBrands.map((brand) => (
              <div
                key={brand.name}
                className="w-[150px] h-[110px] border border-slate-300 bg-white px-2 py-2 flex flex-col items-center justify-center shrink-0"
              >
                <div className="relative h-[90px] w-[130px]">
                  <Image
                    src={brand.logo}
                    alt={brand.name}
                    fill
                    sizes="120px"
                    className="object-contain opacity-90 hover:opacity-100 transition-opacity duration-300"
                  />
                </div>
                <p className="mt-2 text-[14px] font-semibold text-gray-700 text-center leading-tight line-clamp-1 w-full">
                  {brand.name}
                </p>
              </div>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
          disabled={page >= totalPages - 1 || totalPages === 1}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-20 w-10 h-10 rounded-full bg-white shadow-lg border border-slate-100 flex items-center justify-center text-slate-600 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 hover:bg-[#0d3b66] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Show next brands"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>
    </section>
  );
}

