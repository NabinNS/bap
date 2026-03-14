"use client";

import { useState, useRef, useEffect } from "react";
import ProductCard from "@/components/products/ProductCard";
import ProductFilters from "@/components/products/ProductFilters";
import { ChevronLeft, ChevronRight } from "lucide-react";

const PER_PAGE = 50;

const allProducts = [
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
        name: "High-Performance Air Filter",
        price: 24.50,
        originalPrice: 32.00,
        rating: 4,
        image: "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?q=80&w=800&auto=format&fit=crop",
        category: "Engine",
    },
    {
        id: "3",
        name: "Premium Synthetic Motor Oil",
        price: 38.00,
        rating: 5,
        image: "https://images.unsplash.com/photo-159742324403d-d19501a66377?q=80&w=800&auto=format&fit=crop",
        category: "Lubricants",
        isNew: true,
    },
    {
        id: "4",
        name: "Halogen Headlight Bulb",
        price: 15.99,
        originalPrice: 19.99,
        rating: 4,
        image: "https://images.unsplash.com/photo-1549399500-6d710f972e48?q=80&w=800&auto=format&fit=crop",
        category: "Electrical",
    },
    {
        id: "5",
        name: "Shock Absorber Front Set",
        price: 120.00,
        originalPrice: 150.00,
        rating: 5,
        image: "https://images.unsplash.com/photo-1616788494707-ec28f08d05a1?q=80&w=800&auto=format&fit=crop",
        category: "Suspension",
    },
    {
        id: "6",
        name: "Universal Oil Filter",
        price: 12.99,
        rating: 4,
        image: "https://images.unsplash.com/photo-1486006396193-471ca6193b21?q=80&w=800&auto=format&fit=crop",
        category: "Engine",
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
        name: "High-Performance Air Filter",
        price: 24.50,
        originalPrice: 32.00,
        rating: 4,
        image: "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?q=80&w=800&auto=format&fit=crop",
        category: "Engine",
    },
    {
        id: "3",
        name: "Premium Synthetic Motor Oil",
        price: 38.00,
        rating: 5,
        image: "https://images.unsplash.com/photo-159742324403d-d19501a66377?q=80&w=800&auto=format&fit=crop",
        category: "Lubricants",
        isNew: true,
    },
    {
        id: "4",
        name: "Halogen Headlight Bulb",
        price: 15.99,
        originalPrice: 19.99,
        rating: 4,
        image: "https://images.unsplash.com/photo-1549399500-6d710f972e48?q=80&w=800&auto=format&fit=crop",
        category: "Electrical",
    },
    {
        id: "5",
        name: "Shock Absorber Front Set",
        price: 120.00,
        originalPrice: 150.00,
        rating: 5,
        image: "https://images.unsplash.com/photo-1616788494707-ec28f08d05a1?q=80&w=800&auto=format&fit=crop",
        category: "Suspension",
    },
    {
        id: "6",
        name: "Universal Oil Filter",
        price: 12.99,
        rating: 4,
        image: "https://images.unsplash.com/photo-1486006396193-471ca6193b21?q=80&w=800&auto=format&fit=crop",
        category: "Engine",
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
        name: "High-Performance Air Filter",
        price: 24.50,
        originalPrice: 32.00,
        rating: 4,
        image: "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?q=80&w=800&auto=format&fit=crop",
        category: "Engine",
    },
    {
        id: "3",
        name: "Premium Synthetic Motor Oil",
        price: 38.00,
        rating: 5,
        image: "https://images.unsplash.com/photo-159742324403d-d19501a66377?q=80&w=800&auto=format&fit=crop",
        category: "Lubricants",
        isNew: true,
    },
    {
        id: "4",
        name: "Halogen Headlight Bulb",
        price: 15.99,
        originalPrice: 19.99,
        rating: 4,
        image: "https://images.unsplash.com/photo-1549399500-6d710f972e48?q=80&w=800&auto=format&fit=crop",
        category: "Electrical",
    },
    {
        id: "5",
        name: "Shock Absorber Front Set",
        price: 120.00,
        originalPrice: 150.00,
        rating: 5,
        image: "https://images.unsplash.com/photo-1616788494707-ec28f08d05a1?q=80&w=800&auto=format&fit=crop",
        category: "Suspension",
    },
    {
        id: "6",
        name: "Universal Oil Filter",
        price: 12.99,
        rating: 4,
        image: "https://images.unsplash.com/photo-1486006396193-471ca6193b21?q=80&w=800&auto=format&fit=crop",
        category: "Engine",
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
        name: "High-Performance Air Filter",
        price: 24.50,
        originalPrice: 32.00,
        rating: 4,
        image: "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?q=80&w=800&auto=format&fit=crop",
        category: "Engine",
    },
    {
        id: "3",
        name: "Premium Synthetic Motor Oil",
        price: 38.00,
        rating: 5,
        image: "https://images.unsplash.com/photo-159742324403d-d19501a66377?q=80&w=800&auto=format&fit=crop",
        category: "Lubricants",
        isNew: true,
    },
    {
        id: "4",
        name: "Halogen Headlight Bulb",
        price: 15.99,
        originalPrice: 19.99,
        rating: 4,
        image: "https://images.unsplash.com/photo-1549399500-6d710f972e48?q=80&w=800&auto=format&fit=crop",
        category: "Electrical",
    },
    {
        id: "5",
        name: "Shock Absorber Front Set",
        price: 120.00,
        originalPrice: 150.00,
        rating: 5,
        image: "https://images.unsplash.com/photo-1616788494707-ec28f08d05a1?q=80&w=800&auto=format&fit=crop",
        category: "Suspension",
    },
    {
        id: "6",
        name: "Universal Oil Filter",
        price: 12.99,
        rating: 4,
        image: "https://images.unsplash.com/photo-1486006396193-471ca6193b21?q=80&w=800&auto=format&fit=crop",
        category: "Engine",
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
        name: "High-Performance Air Filter",
        price: 24.50,
        originalPrice: 32.00,
        rating: 4,
        image: "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?q=80&w=800&auto=format&fit=crop",
        category: "Engine",
    },
    {
        id: "3",
        name: "Premium Synthetic Motor Oil",
        price: 38.00,
        rating: 5,
        image: "https://images.unsplash.com/photo-159742324403d-d19501a66377?q=80&w=800&auto=format&fit=crop",
        category: "Lubricants",
        isNew: true,
    },
    {
        id: "4",
        name: "Halogen Headlight Bulb",
        price: 15.99,
        originalPrice: 19.99,
        rating: 4,
        image: "https://images.unsplash.com/photo-1549399500-6d710f972e48?q=80&w=800&auto=format&fit=crop",
        category: "Electrical",
    },
    {
        id: "5",
        name: "Shock Absorber Front Set",
        price: 120.00,
        originalPrice: 150.00,
        rating: 5,
        image: "https://images.unsplash.com/photo-1616788494707-ec28f08d05a1?q=80&w=800&auto=format&fit=crop",
        category: "Suspension",
    },
    {
        id: "6",
        name: "Universal Oil Filter",
        price: 12.99,
        rating: 4,
        image: "https://images.unsplash.com/photo-1486006396193-471ca6193b21?q=80&w=800&auto=format&fit=crop",
        category: "Engine",
    },
];

export default function ProductsPage() {
    const [currentPage, setCurrentPage] = useState(1);
    const [asideHeight, setAsideHeight] = useState<number | null>(null);
    const [isRowLayout, setIsRowLayout] = useState(false);
    const asideRef = useRef<HTMLElement>(null);

    const totalPages = Math.ceil(allProducts.length / PER_PAGE) || 1;
    const start = (currentPage - 1) * PER_PAGE;
    const paginatedProducts = allProducts.slice(start, start + PER_PAGE);

    // Match main content height to sidebar (desktop only); sidebar keeps natural height
    useEffect(() => {
        const mq = window.matchMedia("(min-width: 768px)");
        const setRow = () => setIsRowLayout(mq.matches);
        setRow();
        mq.addEventListener("change", setRow);
        return () => mq.removeEventListener("change", setRow);
    }, []);

    useEffect(() => {
        if (!isRowLayout || !asideRef.current) return;
        const el = asideRef.current;
        const ro = new ResizeObserver((entries) => {
            for (const e of entries) setAsideHeight(e.contentRect.height);
        });
        ro.observe(el);
        setAsideHeight(el.getBoundingClientRect().height);
        return () => ro.disconnect();
    }, [isRowLayout]);

    const mainMaxHeight = isRowLayout && asideHeight != null ? asideHeight : undefined;

    return (
        <div className="w-full max-w-[1700px] mx-auto px-4 md:px-6 py-8">
            <div className="flex flex-col md:flex-row gap-8 items-stretch">
                {/* Sidebar Filters - natural height, no fixed height */}
                <aside ref={asideRef} className="w-full md:w-75 shrink-0">
                    <ProductFilters />
                </aside>

                {/* Product Grid - capped to sidebar height on desktop, grid scrolls inside */}
                <main
                    className="flex-1 flex flex-col min-h-0"
                    style={mainMaxHeight != null ? { maxHeight: mainMaxHeight } : undefined}
                >
                    <div className="mb-6 rounded-none border border-slate-300 bg-white px-4 py-3 shrink-0">
                        <div className="flex items-center justify-between flex-wrap gap-4">
                            <div className="flex items-center gap-2">
                            <span className="text-sm text-[#0d3b66]">Sort by:</span>
                            <select className="bg-white border border-slate-200 rounded-none px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d3b66]">
                                <option>Newest First</option>
                                <option>Price: Low to High</option>
                                <option>Price: High to Low</option>
                                <option>Rating</option>
                            </select>
                            </div>
                            <div className="flex items-center gap-4">
                            <span className="text-sm text-[#0d3b66]">
                                Showing {start + 1}–{Math.min(start + PER_PAGE, allProducts.length)} of {allProducts.length}
                            </span>
                            {totalPages > 1 && (
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="p-2 rounded-lg border border-slate-200 text-gray-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        aria-label="Previous page"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <div className="flex items-center gap-1">
                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                            <button
                                                key={page}
                                                type="button"
                                                onClick={() => setCurrentPage(page)}
                                                className={`min-w-[2.25rem] py-2 px-2 rounded-lg text-sm font-medium transition-colors ${
                                                    currentPage === page
                                                        ? "bg-[#0d3b66] text-white"
                                                        : "border border-slate-200 text-gray-600 hover:bg-slate-50"
                                                }`}
                                            >
                                                {page}
                                            </button>
                                        ))}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className="p-2 rounded-lg border border-slate-200 text-gray-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        aria-label="Next page"
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>
                            )}
                            </div>

                        </div>
                    </div>
                    <div className="rounded-none border border-slate-300 p-4 flex-1 min-h-0 overflow-y-auto scrollbar-on-hover">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {paginatedProducts.map((product) => (
                                <ProductCard key={`${product.id}-${start}`} {...product} />
                            ))}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
