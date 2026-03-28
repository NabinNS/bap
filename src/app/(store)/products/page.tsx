"use client";

import { Suspense, useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import ProductCard from "@/components/products/ProductCard";
import ProductFilters from "@/components/products/ProductFilters";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { allProducts as centralizedProducts } from "@/data/products";

const PER_PAGE = 24;

const allProducts = centralizedProducts;

function ProductsPageContent() {
    const searchParams = useSearchParams();
    const categoryParam = searchParams.get("category")?.trim() || null;

    const filteredProducts = categoryParam
        ? allProducts.filter((p) => p.category === categoryParam)
        : allProducts;

    const [currentPage, setCurrentPage] = useState(1);
    const asideRef = useRef<HTMLElement>(null);
    /** On md+, product column height tracks filter column (CSS can’t do “match shorter sibling” when grid is tall). */
    const [productColumnHeight, setProductColumnHeight] = useState<number | null>(null);

    useEffect(() => {
        setCurrentPage(1);
    }, [categoryParam]);

    const totalPages = Math.ceil(filteredProducts.length / PER_PAGE) || 1;
    const start = (currentPage - 1) * PER_PAGE;
    const paginatedProducts = filteredProducts.slice(start, start + PER_PAGE);

    useLayoutEffect(() => {
        const el = asideRef.current;
        if (!el) return;

        const md = () => typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches;

        const sync = () => {
            if (md()) {
                setProductColumnHeight(el.offsetHeight);
            } else {
                setProductColumnHeight(null);
            }
        };

        sync();
        const ro = new ResizeObserver(sync);
        ro.observe(el);

        const mq = window.matchMedia("(min-width: 768px)");
        mq.addEventListener("change", sync);

        return () => {
            ro.disconnect();
            mq.removeEventListener("change", sync);
        };
    }, []);

    return (
        <div className="mx-auto flex w-full max-w-[1700px] flex-1 min-h-0 flex-col px-4 py-8 md:px-6">
            <div className="flex min-h-0 flex-col gap-8 md:flex-row md:items-start">
                <aside
                    ref={asideRef}
                    className="w-full shrink-0 self-start md:w-75 [&>div]:!h-auto"
                >
                    <ProductFilters />
                </aside>

                <main
                    className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden md:min-h-0"
                    style={
                        productColumnHeight != null
                            ? { height: productColumnHeight, maxHeight: productColumnHeight }
                            : undefined
                    }
                >
                    <div className="flex min-h-0 flex-1 flex-col overflow-hidden border border-slate-300 bg-white md:h-full">
                        <div className="shrink-0 border-b border-slate-300 px-4 py-3">
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
                                        {filteredProducts.length === 0 ? (
                                            <>No products in this category</>
                                        ) : (
                                            <>
                                                Showing {start + 1}–{Math.min(start + PER_PAGE, filteredProducts.length)} of{" "}
                                                {filteredProducts.length}
                                                {categoryParam ? (
                                                    <span className="text-slate-500"> ({categoryParam})</span>
                                                ) : null}
                                            </>
                                        )}
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

                        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
                            {filteredProducts.length === 0 ? (
                                <p className="text-center text-sm text-slate-600">
                                    No products match{" "}
                                    <span className="font-medium text-[#0d3b66]">{categoryParam}</span>.{" "}
                                    <Link href="/products" className="text-[#0d3b66] underline hover:no-underline">
                                        View all products
                                    </Link>
                                </p>
                            ) : (
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                    {paginatedProducts.map((product, i) => (
                                        <ProductCard key={`${start}-${i}-${product.id}`} {...product} />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}

export default function ProductsPage() {
    return (
        <Suspense
            fallback={
                <div className="mx-auto flex w-full max-w-[1700px] flex-1 items-center justify-center px-4 py-16 text-sm text-slate-600 md:px-6">
                    Loading products…
                </div>
            }
        >
            <ProductsPageContent />
        </Suspense>
    );
}
