"use client";

import { useRef, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ProductCard from "./ProductCard";

interface ProductSliderProps {
    products: any[];
}

export default function ProductSlider({ products }: ProductSliderProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isScrolling, setIsScrolling] = useState(false);

    // Triple the products for infinite effect
    const loopedProducts = [...products, ...products, ...products];

    // Initialize scroll position to the middle set
    useEffect(() => {
        if (scrollRef.current && products.length > 0) {
            const container = scrollRef.current;
            const singleSetWidth = container.scrollWidth / 3;
            container.scrollLeft = singleSetWidth;
        }
    }, [products.length]);

    const handleInfiniteScroll = () => {
        if (!scrollRef.current || isScrolling) return;

        const container = scrollRef.current;
        const singleSetWidth = container.scrollWidth / 3;

        // If we've scrolled towards the end of the third set, jump back to the middle
        if (container.scrollLeft >= singleSetWidth * 2) {
            container.style.scrollBehavior = "auto";
            container.scrollLeft = container.scrollLeft - singleSetWidth;
        }
        // If we've scrolled towards the beginning of the first set, jump forward to the middle
        else if (container.scrollLeft <= 0) {
            container.style.scrollBehavior = "auto";
            container.scrollLeft = container.scrollLeft + singleSetWidth;
        }
    };

    const scroll = (direction: "left" | "right") => {
        if (scrollRef.current) {
            const container = scrollRef.current;
            const scrollAmount = container.clientWidth * 0.8;

            setIsScrolling(true);
            container.style.scrollBehavior = "smooth";

            if (direction === "left") {
                container.scrollLeft -= scrollAmount;
            } else {
                container.scrollLeft += scrollAmount;
            }

            // Reset snapping after the smooth scroll completes
            setTimeout(() => {
                setIsScrolling(false);
                handleInfiniteScroll();
            }, 600); // Matches standard smooth scroll duration
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
                onScroll={handleInfiniteScroll}
                className="flex overflow-x-auto gap-4 pb-6 hide-scrollbar"
            >
                {loopedProducts.map((product, index) => (
                    <div key={`${product.id}-${index}`} className="min-w-[220px] sm:min-w-[240px] flex-shrink-0">
                        <ProductCard {...product} />
                    </div>
                ))}
            </div>
        </div>
    );
}
