"use client";

import { Suspense, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { apiFetch } from "@/lib/api";
import CategoryCard from "@/features/categories/components/CategoryCard";

type ApiCategory = {
  ulid: string;
  name: string;
  slug: string;
  thumbnail: string | null;
  is_active: boolean;
  products_count?: number;
  created_at?: string;
};

const PER_PAGE = 24;

const SORT_OPTIONS = [
  { value: "newest",    label: "Newest First" },
  { value: "oldest",    label: "Oldest First" },
  { value: "name_asc",  label: "Name: A to Z" },
  { value: "name_desc", label: "Name: Z to A" },
  { value: "popular",   label: "Most Popular" },
];

function sortCategories(cats: ApiCategory[], sort: string): ApiCategory[] {
  const sorted = [...cats];
  switch (sort) {
    case "name_asc":  return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case "name_desc": return sorted.sort((a, b) => b.name.localeCompare(a.name));
    case "oldest":    return sorted.sort((a, b) => (a.created_at ?? "").localeCompare(b.created_at ?? ""));
    case "popular":   return sorted.sort((a, b) => (b.products_count ?? 0) - (a.products_count ?? 0));
    case "newest":
    default:          return sorted.sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));
  }
}

function CategoriesPageContent() {
  const [sort, setSort] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["public-categories-all"],
    queryFn: () => apiFetch<{ data: ApiCategory[] }>("/categories?per_page=200&is_active=true"),
  });

  const sorted = useMemo(() => sortCategories(data?.data ?? [], sort), [data, sort]);

  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const start = (currentPage - 1) * PER_PAGE;
  const paged = sorted.slice(start, start + PER_PAGE);

  function handleSort(value: string) {
    setSort(value);
    setCurrentPage(1);
  }

  return (
    <div className="mx-auto flex w-full max-w-[1700px] flex-1 min-h-0 flex-col px-4 py-8 md:px-6">
      <div className="flex min-h-0 flex-col border border-slate-300 bg-white">
        {/* Toolbar */}
        <div className="shrink-0 border-b border-slate-300 px-4 py-3">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-text-muted">Sort by:</span>
              <select
                value={sort}
                onChange={(e) => handleSort(e.target.value)}
                className="bg-white border border-slate-300 px-3 py-1.5 text-sm text-text-default focus:outline-none focus:ring-2 focus:ring-[#0d3b66] cursor-pointer"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-4">
              {!isLoading && (
                <span className="text-sm text-[#0d3b66]">
                  {total === 0 ? (
                    <>No categories</>
                  ) : (
                    <>Showing {start + 1}–{Math.min(start + PER_PAGE, total)} of {total}</>
                  )}
                </span>
              )}

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

        {/* Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-8 w-8 border-2 border-[#0d3b66] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : paged.length === 0 ? (
            <p className="text-center text-sm text-slate-600 py-16">No categories found.</p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8">
              {paged.map((cat) => (
                <CategoryCard
                  key={cat.ulid}
                  name={cat.name}
                  image={cat.thumbnail ?? undefined}
                  href={`/products?category_ulid=${cat.ulid}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CategoriesPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex w-full max-w-[1700px] flex-1 items-center justify-center px-4 py-16 text-sm text-slate-600 md:px-6">
          Loading categories…
        </div>
      }
    >
      <CategoriesPageContent />
    </Suspense>
  );
}
