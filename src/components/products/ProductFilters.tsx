"use client";

import { useRef, useState } from "react";
import { Search, X, Star } from "lucide-react";

const LIST_LIMIT = 10;

const CATEGORIES = [
  "All",
  "Batteries",
  "Tyres",
  "Engine",
  "Brakes",
  "Suspension",
  "Electrical",
  "Lubricants",
  "Filters",
  "Lights & Bulbs",
  "Body Parts",
  "Cooling",
];

const BRANDS = [
  "BOSCH",
  "DENSO",
  "NGK",
  "Exide",
  "MRF",
  "Apollo",
  "Brembo",
  "MANN+HUMMEL",
];

const RATING_OPTIONS = [
  { value: "4.5", stars: 4.5 },
  { value: "4", stars: 4 },
  { value: "3", stars: 3 },
];

function RatingStars({ value }: { value: number }) {
  const full = Math.floor(value);
  const hasHalf = value % 1 >= 0.5;
  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: full }).map((_, i) => (
        <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
      ))}
      {hasHalf && (
        <Star className="w-4 h-4 fill-amber-400/50 text-amber-400" />
      )}
      <span className="text-xs text-gray-500 ml-1">& up</span>
    </span>
  );
}

export default function ProductFilters() {
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [categoryExpanded, setCategoryExpanded] = useState(false);
  const [brandExpanded, setBrandExpanded] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Show first LIST_LIMIT (10) items until user clicks "Show more"; then show all.
  const categoriesToShow = categoryExpanded ? CATEGORIES : CATEGORIES.slice(0, LIST_LIMIT);
  const brandsToShow = brandExpanded ? BRANDS : BRANDS.slice(0, LIST_LIMIT);
  // Only show the "Show more" button when there are more than LIST_LIMIT items.
  const showCategoryMore = CATEGORIES.length > LIST_LIMIT;
  const showBrandMore = BRANDS.length > LIST_LIMIT;

  const handleSearchClick = () => {
    setSearchExpanded(true);
    setTimeout(() => searchInputRef.current?.focus(), 0);
  };

  const handleSearchBlur = () => {
    if (!searchValue.trim()) setSearchExpanded(false);
  };

  const handleCloseSearch = () => {
    setSearchValue("");
    setSearchExpanded(false);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm flex flex-col">
      {/* Header: Filters + search, or full-width input (in flow so content doesn't hide) */}
      <div className="flex items-center justify-between gap-2 mb-6 shrink-0">
        {searchExpanded ? (
          <div className="flex items-center gap-2 w-full">
            <input
              ref={searchInputRef}
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Search filters..."
              onBlur={handleSearchBlur}
              className="flex-1 min-w-0 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d3b66] focus:border-transparent"
            />
            <button
              type="button"
              onClick={handleCloseSearch}
              className="p-1.5 rounded-lg text-gray-500 hover:bg-slate-100 hover:text-gray-700 transition-colors cursor-pointer shrink-0"
              aria-label="Close search"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <>
            <h2 className="font-bold text-gray-900 text-lg">Filters</h2>
            <button
              type="button"
              onClick={handleSearchClick}
              className="p-1.5 rounded-lg text-gray-500 hover:bg-slate-100 hover:text-[#0d3b66] transition-colors cursor-pointer"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      <div className="space-y-0 overflow-y-auto hide-scrollbar min-h-0 flex-1">
        {/* Category */}
        <div className="border-t border-slate-200 pt-6 first:pt-0 first:border-t-0">
          <h3 className="font-bold text-sm text-gray-900 mb-3 uppercase tracking-wider">
            Category
          </h3>
          <div className="max-h-48 overflow-y-auto overflow-x-hidden space-y-2">
            {categoriesToShow.map((cat) => (
              <label
                key={cat}
                className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer hover:text-[#0d3b66]"
              >
                <input
                  type="checkbox"
                  name="category"
                  value={cat}
                  className="rounded border-gray-300 text-[#0d3b66] focus:ring-[#0d3b66]"
                />
                {cat}
              </label>
            ))}
            {showCategoryMore && (
              <button
                type="button"
                onClick={() => setCategoryExpanded((v) => !v)}
                className="text-sm text-[#0d3b66] font-medium hover:underline cursor-pointer mt-1"
              >
                {categoryExpanded ? "Show less" : "Show more"}
              </button>
            )}
          </div>
        </div>

        {/* Price range */}
        <div className="border-t border-slate-200 pt-6">
          <h3 className="font-bold text-sm text-gray-900 mb-3 uppercase tracking-wider">
            Price range
          </h3>
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="Min"
              min={0}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d3b66] focus:border-transparent"
            />
            <span className="text-gray-400 text-sm">–</span>
            <input
              type="number"
              placeholder="Max"
              min={0}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d3b66] focus:border-transparent"
            />
          </div>
        </div>

        {/* Brand */}
        <div className="border-t border-slate-200 pt-6">
          <h3 className="font-bold text-sm text-gray-900 mb-3 uppercase tracking-wider">
            Brand
          </h3>
          <div className="max-h-48 overflow-y-auto overflow-x-hidden space-y-2">
            {brandsToShow.map((brand) => (
              <label
                key={brand}
                className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer hover:text-[#0d3b66]"
              >
                <input
                  type="checkbox"
                  name="brand"
                  value={brand}
                  className="rounded border-gray-300 text-[#0d3b66] focus:ring-[#0d3b66]"
                />
                {brand}
              </label>
            ))}
            {showBrandMore && (
              <button
                type="button"
                onClick={() => setBrandExpanded((v) => !v)}
                className="text-sm text-[#0d3b66] font-medium hover:underline cursor-pointer mt-1"
              >
                {brandExpanded ? "Show less" : "Show more"}
              </button>
            )}
          </div>
        </div>

        {/* Vehicle fitment */}
        <div className="border-t border-slate-200 pt-6">
          <h3 className="font-bold text-sm text-gray-900 mb-3 uppercase tracking-wider">
            Vehicle fitment
          </h3>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer hover:text-[#0d3b66]">
              <input
                type="radio"
                name="vehicle"
                value="four"
                className="border-gray-300 text-[#0d3b66] focus:ring-[#0d3b66]"
              />
              Four Wheeler
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer hover:text-[#0d3b66]">
              <input
                type="radio"
                name="vehicle"
                value="two"
                className="border-gray-300 text-[#0d3b66] focus:ring-[#0d3b66]"
              />
              Two Wheeler
            </label>
          </div>
        </div>

        {/* Rating */}
        <div className="border-t border-slate-200 pt-6">
          <h3 className="font-bold text-sm text-gray-900 mb-3 uppercase tracking-wider">
            Rating
          </h3>
          <div className="space-y-2">
            {RATING_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer hover:text-[#0d3b66]"
              >
                <input
                  type="checkbox"
                  name="rating"
                  value={opt.value}
                  className="rounded border-gray-300 text-[#0d3b66] focus:ring-[#0d3b66]"
                />
                <RatingStars value={opt.stars} />
              </label>
            ))}
          </div>
        </div>

        {/* Deals */}
        <div className="border-t border-slate-200 pt-6">
          <h3 className="font-bold text-sm text-gray-900 mb-3 uppercase tracking-wider">
            Deals
          </h3>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer hover:text-[#0d3b66]">
              <input
                type="checkbox"
                name="deals"
                value="sale"
                className="rounded border-gray-300 text-[#0d3b66] focus:ring-[#0d3b66]"
              />
              On sale
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer hover:text-[#0d3b66]">
              <input
                type="checkbox"
                name="deals"
                value="discount"
                className="rounded border-gray-300 text-[#0d3b66] focus:ring-[#0d3b66]"
              />
              Discounted
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
