"use client";

import { useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

const LIST_LIMIT = 7;

type Option = { ulid: string; name: string };

export default function ProductFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchExpanded, setSearchExpanded] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [categoryExpanded, setCategoryExpanded] = useState(false);
  const [brandExpanded, setBrandExpanded] = useState(false);
  const [minPrice, setMinPrice] = useState(searchParams.get("min_price") ?? "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("max_price") ?? "");
  const searchInputRef = useRef<HTMLInputElement>(null);

  const activeCategoryUlid = searchParams.get("category_ulid") ?? "";
  const activeBrandUlid = searchParams.get("brand_ulid") ?? "";
  const hasDiscount = searchParams.get("has_discount") === "true";

  const { data: categoriesData } = useQuery({
    queryKey: ["categories", "all"],
    queryFn: () => apiFetch<{ data: Option[] }>("/categories?per_page=100"),
  });
  const { data: brandsData } = useQuery({
    queryKey: ["brands", "all"],
    queryFn: () => apiFetch<{ data: Option[] }>("/brands?per_page=100"),
  });

  const categories = categoriesData?.data ?? [];
  const brands = brandsData?.data ?? [];

  const filteredCategories = searchValue
    ? categories.filter((c) => c.name.toLowerCase().includes(searchValue.toLowerCase()))
    : categories;
  const filteredBrands = searchValue
    ? brands.filter((b) => b.name.toLowerCase().includes(searchValue.toLowerCase()))
    : brands;

  const categoriesToShow = categoryExpanded ? filteredCategories : filteredCategories.slice(0, LIST_LIMIT);
  const brandsToShow = brandExpanded ? filteredBrands : filteredBrands.slice(0, LIST_LIMIT);

  const hasActiveFilters = !!(activeCategoryUlid || activeBrandUlid || hasDiscount || searchParams.get("min_price") || searchParams.get("max_price"));

  function updateParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    value ? params.set(key, value) : params.delete(key);
    params.delete("page");
    router.push(`/products?${params.toString()}`);
  }

  function toggleCategory(ulid: string) {
    updateParam("category_ulid", activeCategoryUlid === ulid ? null : ulid);
  }

  function toggleBrand(ulid: string) {
    updateParam("brand_ulid", activeBrandUlid === ulid ? null : ulid);
  }

  function toggleDiscount() {
    updateParam("has_discount", hasDiscount ? null : "true");
  }

  function applyPrice() {
    const params = new URLSearchParams(searchParams.toString());
    minPrice ? params.set("min_price", minPrice) : params.delete("min_price");
    maxPrice ? params.set("max_price", maxPrice) : params.delete("max_price");
    params.delete("page");
    router.push(`/products?${params.toString()}`);
  }

  function clearAll() {
    const params = new URLSearchParams(searchParams.toString());
    ["category_ulid", "brand_ulid", "has_discount", "min_price", "max_price"].forEach((k) => params.delete(k));
    setMinPrice("");
    setMaxPrice("");
    router.push(`/products?${params.toString()}`);
  }

  return (
    <div className="bg-white border border-slate-100 py-4 px-3 shadow-sm flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-3 shrink-0">
        {searchExpanded ? (
          <div className="flex items-center gap-2 w-full">
            <input
              ref={searchInputRef}
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Search filters..."
              className="flex-1 min-w-0 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d3b66] focus:border-transparent"
            />
            <button
              type="button"
              onClick={() => { setSearchValue(""); setSearchExpanded(false); }}
              className="p-1.5 rounded-lg text-text-muted hover:bg-slate-100 hover:text-text-default transition-colors cursor-pointer shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <>
            <div className="px-4 flex items-center gap-3">
              <h2 className="font-bold text-text-default text-lg">Filters</h2>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-xs text-[#0d3b66] hover:underline cursor-pointer font-medium"
                >
                  Clear all
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => { setSearchExpanded(true); setTimeout(() => searchInputRef.current?.focus(), 0); }}
              className="p-1.5 rounded-lg text-text-muted hover:bg-slate-100 hover:text-text-brand-mid transition-colors cursor-pointer"
            >
              <Search className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      <div className="space-y-4 overflow-y-auto hide-scrollbar min-h-0 flex-1">

        {/* Category */}
        <div className="border border-slate-400 p-4">
          <h3 className="font-bold text-sm text-text-default mb-3 uppercase tracking-wider">Category</h3>
          <div className="max-h-48 overflow-y-auto overflow-x-hidden scrollbar-on-hover space-y-2">
            {categoriesToShow.length === 0 ? (
              <p className="text-xs text-gray-400">No categories found</p>
            ) : categoriesToShow.map((cat) => (
              <label key={cat.ulid} className="flex items-center gap-2 text-sm text-text-muted cursor-pointer hover:text-text-brand-mid">
                <input
                  type="checkbox"
                  checked={activeCategoryUlid === cat.ulid}
                  onChange={() => toggleCategory(cat.ulid)}
                  className="rounded border-gray-300 text-[#0d3b66] focus:ring-[#0d3b66]"
                />
                {cat.name}
              </label>
            ))}
            {filteredCategories.length > LIST_LIMIT && (
              <button
                type="button"
                onClick={() => setCategoryExpanded((v) => !v)}
                className="text-sm text-[#0d3b66] font-medium hover:underline cursor-pointer mt-1"
              >
                {categoryExpanded ? "Show less" : `Show ${filteredCategories.length - LIST_LIMIT} more`}
              </button>
            )}
          </div>
        </div>

        {/* Price range */}
        <div className="border border-slate-400 p-4">
          <h3 className="font-bold text-sm text-text-default mb-3 uppercase tracking-wider">Price range</h3>
          <div className="flex items-center gap-2 mb-2">
            <input
              type="number"
              placeholder="Min"
              min={0}
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="w-full rounded-lg border border-slate-400 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d3b66] focus:border-transparent"
            />
            <span className="text-gray-400 text-sm">–</span>
            <input
              type="number"
              placeholder="Max"
              min={0}
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-full rounded-lg border border-slate-400 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d3b66] focus:border-transparent"
            />
          </div>
          <button
            type="button"
            onClick={applyPrice}
            className="w-full mt-1 px-3 py-1.5 text-sm font-medium bg-[#0d3b66] text-white hover:bg-[#092d50] transition-colors cursor-pointer"
          >
            Apply
          </button>
        </div>

        {/* Brand */}
        <div className="border border-slate-400 p-4">
          <h3 className="font-bold text-sm text-text-default mb-3 uppercase tracking-wider">Brand</h3>
          <div className="max-h-48 overflow-y-auto overflow-x-hidden scrollbar-on-hover space-y-2">
            {brandsToShow.length === 0 ? (
              <p className="text-xs text-gray-400">No brands found</p>
            ) : brandsToShow.map((brand) => (
              <label key={brand.ulid} className="flex items-center gap-2 text-sm text-text-muted cursor-pointer hover:text-text-brand-mid">
                <input
                  type="checkbox"
                  checked={activeBrandUlid === brand.ulid}
                  onChange={() => toggleBrand(brand.ulid)}
                  className="rounded border-gray-300 text-[#0d3b66] focus:ring-[#0d3b66]"
                />
                {brand.name}
              </label>
            ))}
            {filteredBrands.length > LIST_LIMIT && (
              <button
                type="button"
                onClick={() => setBrandExpanded((v) => !v)}
                className="text-sm text-[#0d3b66] font-medium hover:underline cursor-pointer mt-1"
              >
                {brandExpanded ? "Show less" : `Show ${filteredBrands.length - LIST_LIMIT} more`}
              </button>
            )}
          </div>
        </div>

        {/* Deals */}
        <div className="border border-slate-400 p-4">
          <h3 className="font-bold text-sm text-text-default mb-3 uppercase tracking-wider">Deals</h3>
          <label className="flex items-center gap-2 text-sm text-text-muted cursor-pointer hover:text-text-brand-mid">
            <input
              type="checkbox"
              checked={hasDiscount}
              onChange={toggleDiscount}
              className="rounded border-gray-300 text-[#0d3b66] focus:ring-[#0d3b66]"
            />
            On sale / Discounted
          </label>
        </div>

      </div>
    </div>
  );
}
