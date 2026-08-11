"use client";

import { Suspense, useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import ProductCard from "@/features/products/components/ProductCard";
import ProductFilters from "@/features/products/components/ProductFilters";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { apiFetch } from "@/lib/api";

const PER_PAGE = 24;

type ApiProduct = {
    ulid: string;
    name: string;
    sales_price: number | null;
    thumbnail: string | null;
    is_active: boolean;
    is_featured: boolean;
    category: { ulid: string; name: string } | null;
    active_discount: { percentage: number } | null;
};

type ApiResponse = {
    data: ApiProduct[];
    meta: { total: number; last_page: number; current_page: number };
};

function ProductsPageContent() {
    const searchParams = useSearchParams();
    const categoryParam = searchParams.get("category_ulid")?.trim() || null;
    const qParam = searchParams.get("q")?.trim() || null;
    const brandParam = searchParams.get("brand_ulid")?.trim() || null;
    const minPriceParam = searchParams.get("min_price")?.trim() || null;
    const maxPriceParam = searchParams.get("max_price")?.trim() || null;
    const hasDiscountParam = searchParams.get("has_discount")?.trim() || null;
    const sortParam = searchParams.get("sort") || "newest";
    const router = useRouter();

    const [currentPage, setCurrentPage] = useState(1);
    const asideRef = useRef<HTMLElement>(null);
    const [productColumnHeight, setProductColumnHeight] = useState<number | null>(null);

    useEffect(() => {
        setCurrentPage(1);
    }, [categoryParam, qParam, brandParam, minPriceParam, maxPriceParam, hasDiscountParam, sortParam]);

    const SORT_MAP: Record<string, { sort_by: string; sort_dir: string }> = {
        newest:        { sort_by: "created_at", sort_dir: "desc" },
        oldest:        { sort_by: "created_at", sort_dir: "asc" },
        price_asc:     { sort_by: "sales_price", sort_dir: "asc"  },
        price_desc:    { sort_by: "sales_price", sort_dir: "desc" },
        name_asc:      { sort_by: "name",         sort_dir: "asc" },
    };

    const { data, isLoading } = useQuery({
        queryKey: ["store-products", currentPage, categoryParam, qParam, brandParam, minPriceParam, maxPriceParam, hasDiscountParam, sortParam],
        queryFn: () => {
            const params = new URLSearchParams();
            params.set("per_page", String(PER_PAGE));
            params.set("page", String(currentPage));
            params.set("is_active", "true");
            const { sort_by, sort_dir } = SORT_MAP[sortParam] ?? SORT_MAP.newest;
            params.set("sort_by", sort_by);
            params.set("sort_dir", sort_dir);
            if (qParam) params.set("search", qParam);
            if (categoryParam) params.set("category_ulid", categoryParam);
            if (brandParam) params.set("brand_ulid", brandParam);
            if (minPriceParam) params.set("min_price", minPriceParam);
            if (maxPriceParam) params.set("max_price", maxPriceParam);
            if (hasDiscountParam) params.set("has_discount", hasDiscountParam);
            return apiFetch<ApiResponse>(`/products?${params.toString()}`);
        },
    });

    function setSort(value: string) {
        const params = new URLSearchParams(searchParams.toString());
        params.set("sort", value);
        params.delete("page");
        router.push(`/products?${params.toString()}`);
    }

    const products = data?.data ?? [];
    const total = data?.meta?.total ?? 0;
    const totalPages = data?.meta?.last_page ?? 1;
    const start = (currentPage - 1) * PER_PAGE;

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
                                    <span className="text-sm font-medium text-text-muted">Sort by:</span>
                                    <select
                                        value={sortParam}
                                        onChange={(e) => setSort(e.target.value)}
                                        className="bg-white border border-slate-300 px-3 py-1.5 text-sm text-text-default focus:outline-none focus:ring-2 focus:ring-[#0d3b66] cursor-pointer"
                                    >
                                        <option value="newest">Newest First</option>
                                        <option value="oldest">Oldest First</option>
                                        <option value="price_asc">Price: Low to High</option>
                                        <option value="price_desc">Price: High to Low</option>
                                        <option value="name_asc">Name: A to Z</option>
                                    </select>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-sm text-[#0d3b66]">
                                        {isLoading ? (
                                            <>Loading…</>
                                        ) : total === 0 ? (
                                            <>No matching products</>
                                        ) : (
                                            <>
                                                Showing {start + 1}–{Math.min(start + PER_PAGE, total)} of {total}
                                                {categoryParam && <span className="text-slate-500"> · {categoryParam}</span>}
                                                {qParam && <span className="text-slate-500"> · &ldquo;{qParam}&rdquo;</span>}
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
                                            >
                                                <ChevronRight className="w-5 h-5" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
                            {isLoading ? (
                                <div className="flex items-center justify-center py-16">
                                    <div className="h-8 w-8 border-2 border-[#0d3b66] border-t-transparent rounded-full animate-spin" />
                                </div>
                            ) : products.length === 0 ? (
                                <p className="text-center text-sm text-slate-600">
                                    No products found
                                    {qParam && <> matching <span className="font-medium text-[#0d3b66]">&ldquo;{qParam}&rdquo;</span></>}
                                    {categoryParam && <> in <span className="font-medium text-[#0d3b66]">{categoryParam}</span></>}.{" "}
                                    <Link href="/products" className="text-[#0d3b66] underline hover:no-underline">View all products</Link>
                                </p>
                            ) : (
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                    {products.map((product) => {
                                        const salesPrice = product.sales_price ?? 0;
                                        const discount = product.active_discount;
                                        const price = discount
                                            ? Math.round(salesPrice * (1 - discount.percentage / 100))
                                            : salesPrice;
                                        return (
                                            <ProductCard
                                                key={product.ulid}
                                                ulid={product.ulid}
                                                name={product.name}
                                                price={price}
                                                originalPrice={discount ? salesPrice : undefined}
                                                thumbnail={product.thumbnail}
                                                category={product.category?.name ?? null}
                                            />
                                        );
                                    })}
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
