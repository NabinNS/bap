"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import CategoryCard from "./CategoryCard";
import type { HomeCategory } from "@/data/storeHome";

interface CategorySliderProps {
    categories: HomeCategory[];
}

export default function CategorySlider({ categories }: CategorySliderProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

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

    return (
        <div className="group relative">
            {/* Left Button */}
            <button
                onClick={() => scroll("left")}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-20 w-10 h-10 rounded-full bg-white shadow-lg border border-slate-100 flex items-center justify-center text-slate-600 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 hover:bg-[#0d3b66] hover:text-white"
                aria-label="Scroll left"
            >
                <ChevronLeft className="w-6 h-6" />
            </button>

            {/* Right Button */}
            <button
                onClick={() => scroll("right")}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-20 w-10 h-10 rounded-full bg-white shadow-lg border border-slate-100 flex items-center justify-center text-slate-600 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 hover:bg-[#0d3b66] hover:text-white"
                aria-label="Scroll right"
            >
                <ChevronRight className="w-6 h-6" />
            </button>

            {/* Scrollable Container */}
            <div
                ref={scrollRef}
                className="flex overflow-x-auto gap-4 pb-4 hide-scrollbar scroll-smooth"
            >
                {categories.map((category) => (
                    <div key={category.name} className="min-w-[220px] sm:min-w-[240px] flex-shrink-0">
                        <CategoryCard {...category} />
                    </div>
                ))}
            </div>
        </div>
    );
}
